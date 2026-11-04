$ErrorActionPreference = "Stop"

$taskName = "GitHub Organization Keep Alive"

$task = Get-ScheduledTask `
    -TaskName $taskName `
    -ErrorAction SilentlyContinue

if ($null -eq $task) {
    Write-Host "Scheduled task not found. Nothing to uninstall."
    exit 0
}

Unregister-ScheduledTask `
    -TaskName $taskName `
    -Confirm:$false

Write-Host ""
Write-Host "Scheduled task uninstalled successfully."
Write-Host "Task: $taskName"
Write-Host ""