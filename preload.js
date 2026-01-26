const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Setup reminders in the main process (reliable, works in background)
    setupReminders: (medications, checkinReminder) => {
        ipcRenderer.send('setup-reminders', { medications, checkinReminder });
    },

    // Show a notification from renderer
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body });
    },

    // Get scheduled jobs info
    getScheduledJobs: () => ipcRenderer.invoke('get-scheduled-jobs'),

    // Listen for open-checkin command from tray
    onOpenCheckin: (callback) => {
        ipcRenderer.on('open-checkin', callback);
    },

    // Auto-backup functions
    saveAutoBackup: (data) => ipcRenderer.invoke('save-auto-backup', data),
    onRequestAutoBackup: (callback) => {
        ipcRenderer.on('request-auto-backup', callback);
    },

    // Check if running in Electron
    isElectron: true,

    // Platform info
    platform: process.platform
});

// Log that preload is ready
console.log('Preload script loaded - Electron APIs exposed');
