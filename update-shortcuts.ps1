$shell = New-Object -ComObject WScript.Shell

# Update Desktop shortcut
$desktopLnk = $shell.CreateShortcut("C:\Users\kandy\OneDrive\Desktop\Wellness Tracker.lnk")
$desktopLnk.TargetPath = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist\Wellness Tracker 1.0.0.exe"
$desktopLnk.WorkingDirectory = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist"
$desktopLnk.Save()
Write-Host "Desktop shortcut updated"

# Update Start Menu shortcut
$startLnk = $shell.CreateShortcut("C:\Users\kandy\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Wellness Tracker 1.0.0.lnk")
$startLnk.TargetPath = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist\Wellness Tracker 1.0.0.exe"
$startLnk.WorkingDirectory = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app\dist"
$startLnk.Save()
Write-Host "Start Menu shortcut updated"

Write-Host "All shortcuts updated to point to the new exe!"
