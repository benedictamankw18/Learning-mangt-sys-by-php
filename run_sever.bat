@echo off
echo Starting services...

REM Start PHP built-in server
cd /d D:\db\lms-api\public
start "PHP Server" cmd /k php -S localhost:8000 router.php

REM Start Nginx
cd /d D:\db\nginx-1.28.2
start "Nginx" cmd /k nginx.exe



echo All services started.
pause