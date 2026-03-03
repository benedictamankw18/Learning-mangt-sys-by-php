# Test Runner Shortcuts
# Quick access to common test scenarios

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║              LMS API Test Runner                           ║
║              Select a test scenario:                       ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n1. Quick Test (All Endpoints - Fast)" -ForegroundColor Green
Write-Host "2. Full Test (All Endpoints + CRUD)" -ForegroundColor Yellow
Write-Host "3. Test Students Only" -ForegroundColor Cyan
Write-Host "4. Test Teachers Only" -ForegroundColor Cyan
Write-Host "5. Test Academic Structure (Years, Semesters, Subjects)" -ForegroundColor Cyan
Write-Host "6. Test Assessments & Grading" -ForegroundColor Cyan
Write-Host "7. Test Dashboard" -ForegroundColor Cyan
Write-Host "8. Test Authentication" -ForegroundColor Cyan
Write-Host "9. Verbose Test (See All Requests)" -ForegroundColor Magenta
Write-Host "0. Exit" -ForegroundColor Red

$choice = Read-Host "`nEnter your choice (0-9)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning Quick Test..." -ForegroundColor Green
        .\test-api.ps1 -QuickTest
    }
    "2" {
        Write-Host "`nRunning Full Test (This may take 2-5 minutes)..." -ForegroundColor Yellow
        .\test-api.ps1
    }
    "3" {
        Write-Host "`nTesting Student Endpoints..." -ForegroundColor Cyan
        .\test-api.ps1 -Category students -Verbose
    }
    "4" {
        Write-Host "`nTesting Teacher Endpoints..." -ForegroundColor Cyan
        .\test-api.ps1 -Category teachers -Verbose
    }
    "5" {
        Write-Host "`nTesting Academic Structure..." -ForegroundColor Cyan
        Write-Host "Testing: Academic Years, Semesters, Subjects`n" -ForegroundColor DarkGray
        .\test-api.ps1 -Category academic-years
        .\test-api.ps1 -Category semesters
        .\test-api.ps1 -Category subjects
    }
    "6" {
        Write-Host "`nTesting Assessments & Grading..." -ForegroundColor Cyan
        .\test-api.ps1 -Category assessments
        .\test-api.ps1 -Category grade-scales
        .\test-api.ps1 -Category grade-reports
    }
    "7" {
        Write-Host "`nTesting Dashboard Endpoints..." -ForegroundColor Cyan
        .\test-api.ps1 -Category dashboard -Verbose
    }
    "8" {
        Write-Host "`nTesting Authentication..." -ForegroundColor Cyan
        .\test-api.ps1 -Category auth -Verbose
    }
    "9" {
        Write-Host "`nRunning Verbose Test (All output shown)..." -ForegroundColor Magenta
        .\test-api.ps1 -QuickTest -Verbose
    }
    "0" {
        Write-Host "`nExiting..." -ForegroundColor Red
        exit 0
    }
    default {
        Write-Host "`nInvalid choice. Please run again and select 0-9." -ForegroundColor Red
        exit 1
    }
}

# Show completion message
Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "Test execution complete!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host "`nCheck the test-results-*.json file for detailed results." -ForegroundColor Cyan
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
