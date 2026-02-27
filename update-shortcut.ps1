$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Wellness Tracker 1.0.0.lnk")
$shortcut.TargetPath = "$env:USERPROFILE\OneDrive\AngelMetrix SEM\wellness-tracker-app\Run Wellness Tracker.vbs"
$shortcut.WorkingDirectory = "$env:USERPROFILE\OneDrive\AngelMetrix SEM\wellness-tracker-app"
$shortcut.Save()
Write-Host "Shortcut updated!"
