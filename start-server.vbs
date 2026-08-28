' start-server.vbs
' Launches the Kwibuka Vite dev server silently (no console window)
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "cmd /c """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\start-server.bat""", 0, False
Set shell = Nothing
