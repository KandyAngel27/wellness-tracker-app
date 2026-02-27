Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\kandy\OneDrive\AngelMetrix SEM\wellness-tracker-app"
WshShell.Run "cmd /c npx electron .", 0, False
