@echo off
chcp 65001 >nul
title CE Lab Booking System — Local Server

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   CE Lab Booking System                  ║
echo  ║   กำลังเริ่ม server...                   ║
echo  ╚══════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo  [ติดตั้ง dependencies ก่อน...]
    call npm install
    echo.
)

REM Open browser after 2 seconds
start "" /B timeout /t 2 /nobreak >nul && start "" "http://localhost:3000"

REM Start server
echo  กำลังเปิดเบราว์เซอร์ที่ http://localhost:3000
echo  กด Ctrl+C เพื่อหยุด server
echo.
node server.js

pause
