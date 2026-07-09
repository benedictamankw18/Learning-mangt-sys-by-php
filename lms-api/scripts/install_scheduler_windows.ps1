Param(
    [string]$TaskName = "LMS Report Scheduler",
    [int]$IntervalMinutes = 15,
    [string]$PhpPath = "php"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workerPath = Join-Path $scriptDir "report_schedule_worker.php"

if (-not (Test-Path $workerPath)) {
    Write-Error "Worker script not found: $workerPath"
    exit 1
}

$action = New-ScheduledTaskAction -Execute $PhpPath -Argument "`"$workerPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Limited

try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
    Write-Host "Scheduled task '$TaskName' created/updated to run every $IntervalMinutes minutes."
}
catch {
    Write-Error "Failed to register scheduled task: $($_.Exception.Message)"
    exit 1
}
