@echo off
setlocal enabledelayedexpansion

:: ============================
:: CONFIG
:: ============================
set API_URL=http://localhost:8000
set API_PORT=8000
set NGINX_PORT=80

:: ============================
:: COLORS
:: ============================
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

set GREEN=%ESC%[92m
set RED=%ESC%[91m
set YELLOW=%ESC%[93m
set RESET=%ESC%[0m

:: ============================
:: MENU
:: ============================
:MENU
cls
echo ==================================
echo      SERVER CONTROL PANEL
echo ==================================
echo 1. Start All
echo 2. Stop All
echo 3. Restart All
echo.
echo 4. Start API
echo 5. Stop API
echo 6. Restart API
echo.
echo 7. Start Nginx
echo 8. Stop Nginx
echo 9. Restart Nginx
echo.
echo 10. Status
echo 0. Exit
echo ==================================
set /p choice=Select option: 

if "%choice%"=="1" call :START_ALL
if "%choice%"=="2" call :STOP_ALL
if "%choice%"=="3" call :RESTART_ALL

if "%choice%"=="4" call :START_API
if "%choice%"=="5" call :STOP_API
if "%choice%"=="6" call :RESTART_API

if "%choice%"=="7" call :START_NGINX
if "%choice%"=="8" call :STOP_NGINX
if "%choice%"=="9" call :RESTART_NGINX

if "%choice%"=="10" call :STATUS
if "%choice%"=="0" exit

pause
goto MENU

:: ============================
:: FULL STACK
:: ============================
:START_ALL
call :START_API
call :START_NGINX
echo %GREEN%All services started.%RESET%
goto :eof

:STOP_ALL
call :STOP_API
call :STOP_NGINX
echo %YELLOW%All services stopped.%RESET%
goto :eof

:RESTART_ALL
call :STOP_ALL
timeout /t 2 >nul
call :START_ALL
goto :eof

:: ============================
:: API (PHP)
:: ============================
:START_API
echo Starting API...

REM Duplicate check (port)
netstat -ano | find ":%API_PORT%" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%API already running on port %API_PORT%.%RESET%
    goto :eof
)

cd /d D:\db\lms-api\public
start "PHP API" cmd /k php -S localhost:%API_PORT%

timeout /t 2 >nul

REM Health check
powershell -Command ^
 "try { (Invoke-WebRequest '%API_URL%' -UseBasicParsing).StatusCode } catch { 0 }" > temp.txt

set /p STATUS=<temp.txt
del temp.txt

if "%STATUS%"=="200" (
    echo %GREEN%API started successfully.%RESET%
    start "" %API_URL%
) else (
    echo %RED%API started but health check failed.%RESET%
)

goto :eof

:STOP_API
echo Stopping API...
set FOUND=0

for /f "tokens=5" %%a in ('netstat -ano ^| find ":%API_PORT%" ^| find "LISTENING"') do (
    set FOUND=1
    taskkill /f /pid %%a >nul 2>&1
)

if !FOUND! EQU 1 (
    echo %GREEN%API stopped.%RESET%
) else (
    echo %YELLOW%API not running.%RESET%
)

goto :eof

:RESTART_API
call :STOP_API
timeout /t 2 >nul
call :START_API
goto :eof

:: ============================
:: NGINX
:: ============================
:START_NGINX
echo Starting Nginx...

REM Duplicate check (process)
tasklist | find /i "nginx.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%Nginx already running.%RESET%
    goto :eof
)

cd /d D:\db\nginx-1.28.2
start "Nginx" cmd /k nginx.exe

timeout /t 2 >nul

REM Health check (port)
netstat -ano | find ":%NGINX_PORT%" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%Nginx started successfully.%RESET%
) else (
    echo %RED%Nginx may have failed to start.%RESET%
)

goto :eof

:STOP_NGINX
echo Stopping Nginx...
cd /d D:\db\nginx-1.28.2
nginx.exe -s stop >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo %GREEN%Nginx stopped.%RESET%
) else (
    echo %YELLOW%Nginx not running.%RESET%
)

goto :eof

:RESTART_NGINX
call :STOP_NGINX
timeout /t 2 >nul
call :START_NGINX
goto :eof

:: ============================
:: STATUS
:: ============================
:STATUS
echo Checking status...

REM API
netstat -ano | find ":%API_PORT%" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%API: RUNNING%RESET%
) else (
    echo %RED%API: STOPPED%RESET%
)

REM Nginx
tasklist | find /i "nginx.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%Nginx: RUNNING%RESET%
) else (
    echo %RED%Nginx: STOPPED%RESET%
)

goto :eof