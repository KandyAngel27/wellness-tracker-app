const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

exports.checkMedReminders = onSchedule("every 1 minutes", async () => {
  // Read all needed docs in parallel
  const [dataDoc, tokenDoc, stateDoc] = await Promise.all([
    db.doc("wellness/data").get(),
    db.doc("wellness/fcmTokens").get(),
    db.doc("wellness/notificationState").get(),
  ]);

  if (!dataDoc.exists || !tokenDoc.exists) return;

  const appData = dataDoc.data();
  const tokenData = tokenDoc.data();
  const tokens = tokenData.tokens || [];
  const timezone = tokenData.timezone || "America/Chicago";
  const notifState = stateDoc.exists ? stateDoc.data() : {};

  if (tokens.length === 0) return;

  // Get current time in user's timezone
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeParts = timeFormatter.formatToParts(now);
  const hour = timeParts.find((p) => p.type === "hour").value;
  const minute = timeParts.find((p) => p.type === "minute").value;
  const currentTime = `${hour}:${minute}`;

  // Get today's date in user's timezone (YYYY-MM-DD)
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
  });
  const todayStr = dateFormatter.format(now);

  // Get day of week (0=Sun)
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  });
  const dayName = dayFormatter.format(now);
  const dayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const currentDay = dayMap[dayName];

  const todayLog = (appData.dailyLogs && appData.dailyLogs[todayStr]) || {};
  const notifications = [];
  const stateUpdates = {};

  // Check each medication
  const medications = appData.medications || [];
  for (const med of medications) {
    if (!med.reminderEnabled || !med.time) continue;
    if (med.schedule === "asneeded") continue;

    const shouldTakeToday =
      med.schedule === "daily" ||
      (med.schedule === "weekly" && med.days && med.days.includes(currentDay));
    if (!shouldTakeToday) continue;
    if (med.time !== currentTime) continue;

    const alreadyTaken =
      todayLog.medications && todayLog.medications[med.id] === true;
    if (alreadyTaken) continue;

    const stateKey = `med_${med.id}`;
    if (notifState[stateKey] === todayStr) continue;

    notifications.push({
      title: `Time for ${med.name}! ${med.emoji || ""}`.trim(),
      body: `Don't forget to take your ${med.name}`,
    });
    stateUpdates[stateKey] = todayStr;
  }

  // Check check-in reminder
  if (
    appData.checkinReminder &&
    appData.checkinReminder.enabled &&
    appData.checkinReminder.time === currentTime
  ) {
    const alreadyLogged = todayLog.symptoms != null;
    if (!alreadyLogged && notifState["checkin"] !== todayStr) {
      notifications.push({
        title: "Morning Check-In Time!",
        body: "How are you feeling today? Log your motivation, energy, sleep, and track your recovery.",
      });
      stateUpdates["checkin"] = todayStr;
    }
  }

  if (notifications.length === 0) return;

  // Send notifications to all registered tokens
  const messaging = getMessaging();
  const staleTokens = [];
  for (const notif of notifications) {
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: notif.title,
            body: notif.body,
          },
          webpush: {
            notification: {
              icon: "https://kandyphoenix.github.io/wellness-tracker-app/icon.png",
              badge: "https://kandyphoenix.github.io/wellness-tracker-app/icon.png",
              vibrate: [200, 100, 200],
              requireInteraction: true,
            },
          },
        });
        console.log(`Sent: ${notif.title}`);
      } catch (err) {
        console.error(`Send failed:`, err.code);
        if (
          err.code === "messaging/registration-token-not-registered" ||
          err.code === "messaging/invalid-registration-token"
        ) {
          staleTokens.push(token);
        }
      }
    }
  }

  // Update notification state to prevent duplicate sends
  if (Object.keys(stateUpdates).length > 0) {
    await db.doc("wellness/notificationState").set(stateUpdates, { merge: true });
  }

  // Clean up stale tokens
  if (staleTokens.length > 0) {
    await db.doc("wellness/fcmTokens").update({
      tokens: FieldValue.arrayRemove(...staleTokens),
    });
    console.log(`Removed ${staleTokens.length} stale token(s)`);
  }
});
