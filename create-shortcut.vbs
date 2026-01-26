Set WshShell = CreateObject("WScript.Shell")
Set shortcut = WshShell.CreateShortcut("C:\Users\kandy\Desktop\Wellness Tracker.lnk")
shortcut.TargetPath = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist\Wellness Tracker 1.0.0.exe"
shortcut.WorkingDirectory = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist"
shortcut.Description = "Wellness & Medication Tracker"
shortcut.Save
