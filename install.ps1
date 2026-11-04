
$ErrorActionPreference = "Stop"

# Project configuration
$projectRoot = $PSScriptRoot
$settingsPath = Join-Path $projectRoot "config\settings.json"
$localSettingsPath = Join-Path $projectRoot "config\settings.local.json"

$taskName = "GitHub Organization Keep Alive"

# Load shared settings
$settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable

# Merge local schedule settings
if (Test-Path $localSettingsPath) {
    $localSettings = Get-Content $localSettingsPath -Raw | ConvertFrom-Json -AsHashtable

    if ($localSettings.Schedule) {
        if (-not $settings.Schedule) {
            $settings.Schedule = @{}
        }

        foreach ($key in $localSettings.Schedule.Keys) {
            $settings.Schedule[$key] = $localSettings.Schedule[$key]
        }
    }
}

$schedule = $settings.Schedule

# Remove existing task if scheduling is disabled
if (-not $schedule.Enabled) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    Write-Host "Scheduling is disabled. Existing task removed if present."
    exit 0
}

# Validate schedule days
$days = @($schedule.Days)

if ($days.Count -eq 0) {
    throw "Schedule.Days must contain at least one day."
}

foreach ($day in $days) {
    if ([string]$day -notmatch '^[1-7]$') {
        throw "Schedule.Days must contain values between 1 and 7."
    }
}

$days = @($days | ForEach-Object { [int]$_ } | Sort-Object -Unique)

# Validate schedule times
$times = @($schedule.Times)

if ($times.Count -eq 0) {
    throw "Schedule.Times must contain at least one time."
}

$validatedTimes = @(
    foreach ($timeValue in $times) {
        $timeText = [string]$timeValue

        if ($timeText -notmatch '^\d{1,4}$') {
            throw "Invalid schedule time: $timeValue. Use HHmm format."
        }

        $timeText = $timeText.PadLeft(4, '0')

        $hour = [int]$timeText.Substring(0, 2)
        $minute = [int]$timeText.Substring(2, 2)

        if ($hour -gt 23 -or $minute -gt 59) {
            throw "Invalid schedule time: $timeValue. Valid range is 0000-2359."
        }

        [PSCustomObject]@{
            Hour = $hour
            Minute = $minute
            Text = $timeText
        }
    }
)

$validatedTimes = @(
    $validatedTimes |
        Sort-Object Text -Unique
)

# Convert ISO weekday numbers to Windows weekdays
$dayMap = @{
    1 = [System.DayOfWeek]::Monday
    2 = [System.DayOfWeek]::Tuesday
    3 = [System.DayOfWeek]::Wednesday
    4 = [System.DayOfWeek]::Thursday
    5 = [System.DayOfWeek]::Friday
    6 = [System.DayOfWeek]::Saturday
    7 = [System.DayOfWeek]::Sunday
}

$daysOfWeek = @(
    $days | ForEach-Object { $dayMap[$_] }
)

# Locate Node.js
$nodeCommand = Get-Command node.exe -ErrorAction Stop
$nodePath = $nodeCommand.Source

$mainScriptPath = Join-Path $projectRoot "automation\main.js"

if (-not (Test-Path $mainScriptPath)) {
    throw "Automation entry point not found: $mainScriptPath"
}

# Create scheduled task action
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "`"$mainScriptPath`"" `
    -WorkingDirectory $projectRoot

# Create one weekly trigger for each configured time
$triggers = @(
    foreach ($time in $validatedTimes) {
        $runTime = [datetime]::Today.AddHours($time.Hour).AddMinutes($time.Minute)

        New-ScheduledTaskTrigger `
            -Weekly `
            -DaysOfWeek $daysOfWeek `
            -At $runTime
    }
)

$principal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Limited

$description = "Runs GitHub Organization Keep Alive automation."

Register-ScheduledTask `
    -TaskName $taskName `
    -Description $description `
    -Action $action `
    -Trigger $triggers `
    -Principal $principal `
    -Force | Out-Null

Write-Host ""
Write-Host "Scheduled task installed successfully."
Write-Host "Task     : $taskName"
Write-Host "Days     : $($days -join ', ')"
Write-Host "Times    : $(($validatedTimes | ForEach-Object { "$($_.Text.Substring(0, 2)):$($_.Text.Substring(2, 2))" }) -join ', ')"
Write-Host "Node.js  : $nodePath"
Write-Host ""
