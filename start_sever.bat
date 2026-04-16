@echo off
setlocal enabledelayedexpansion

:: ============================
:: CONFIG
:: ============================
set API_PORT=8000
set API_URL=http://localhost:8000
set API_DIR=D:\db\lms-api\public

set NGINX_DIR=D:\db\nginx-1.28.2
set DASHBOARD_URL=http://localhost:8080/
set DASHBOARD_PORT=8080

:: ============================
:MENU
cls
echo ==============================
echo     SERVER MANAGER
echo ==============================
echo 1. Start API
echo 2. Stop API
echo 3. Restart API
echo.
echo 4. Start Nginx
echo 5. Stop Nginx
echo 6. Restart Nginx
echo.
echo 7. Open Dashboard
echo 8. Status
echo 0. Exit
echo ==============================
set /p choice=Select:

if "%choice%"=="1" goto START_API
if "%choice%"=="2" goto STOP_API
if "%choice%"=="3" goto RESTART_API

if "%choice%"=="4" goto START_NGINX
if "%choice%"=="5" goto STOP_NGINX
if "%choice%"=="6" goto RESTART_NGINX

if "%choice%"=="7" goto OPEN_DASHBOARD
if "%choice%"=="8" goto STATUS
if "%choice%"=="0" exit

goto MENU

:: ============================
:: API
:: ============================
:START_API
echo Starting API...

netstat -ano | find ":%API_PORT%" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo API already running.
    pause
    goto MENU
)

cd /d %API_DIR%
start "PHP API" cmd /k php -S localhost:%API_PORT%

echo API started.
pause
goto MENU

:STOP_API
echo Stopping API...

for /f "tokens=5" %%a in ('netstat -ano ^| find ":%API_PORT%" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

taskkill /F /IM php.exe >nul 2>&1

echo API stopped.
pause
goto MENU

:RESTART_API
call :STOP_API
timeout /t 2 >nul
call :START_API
goto MENU

:: ============================
:: NGINX
:: ============================
:START_NGINX
echo Starting Nginx...

tasklist | find /i "nginx.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo Nginx already running.
    pause
    goto MENU
)

cd /d %NGINX_DIR%
start "Nginx" cmd /k nginx.exe

echo Nginx started.
pause
goto MENU

:STOP_NGINX
echo Stopping Nginx...

cd /d %NGINX_DIR%
nginx.exe -s stop >nul 2>&1

taskkill /F /IM nginx.exe >nul 2>&1

echo Nginx stopped.
pause
goto MENU

:RESTART_NGINX
call :STOP_NGINX
timeout /t 2 >nul
call :START_NGINX
goto MENU

:: ============================
:: DASHBOARD
:: ============================
:OPEN_DASHBOARD
netstat -ano | find ":%DASHBOARD_PORT%" | find "LISTENING" >nul

if %ERRORLEVEL% EQU 0 (
    start "" %DASHBOARD_URL%
) else (
    echo Dashboard not running on port %DASHBOARD_PORT%.
)

pause
goto MENU

:: ============================
:: STATUS
:: ============================
:STATUS
echo Checking services...

netstat -ano | find ":%API_PORT%" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo API: RUNNING
) else (
    echo API: STOPPED
)

tasklist | find /i "nginx.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo Nginx: RUNNING
) else (
    echo Nginx: STOPPED
)

pause
goto MENU