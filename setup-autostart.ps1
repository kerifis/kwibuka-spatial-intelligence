# setup-autostart.ps1
# Run this ONCE as Administrator to register the Kwibuka Vite server
# as a Windows Task Scheduler job that starts automatically at login.
#
# Usage (in an elevated PowerShell):
#   .\setup-autostart.ps1

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath    = Join-Path $projectDir "start-server.vbs"
$taskName   = "KwibukaSpatialServer"

# Remove old task if it exists
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed existing task '$taskName'."
}

$action  = New-ScheduledTaskAction  -Execute "wscript.exe" -Argument "`"$vbsPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew `
    -StopIfGoingOnBatteries:$false `
    -DisallowHardTerminate:$false

Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action  `
    -Trigger  $trigger `
    -Settings $settings `
    -RunLevel Highest  `
    -Force

Write-Host ""
Write-Host "✅ Task '$taskName' registered successfully." -ForegroundColor Green
Write-Host "   The Vite dev server will start automatically at every login."
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  Start now  : Start-ScheduledTask  -TaskName '$taskName'"
Write-Host "  Stop       : Stop-ScheduledTask   -TaskName '$taskName'"
Write-Host "  Remove     : Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
Write-Host "  Status     : Get-ScheduledTask    -TaskName '$taskName' | Select-Object State"

# Optionally start the task immediately
$start = Read-Host "Start the server right now? (y/N)"
if ($start -match '^[yY]') {
    Start-ScheduledTask -TaskName $taskName
    Write-Host "🚀 Server started. Check http://localhost:5173" -ForegroundColor Cyan
}
