@echo off
title AgriSmart — One-Click Automated Setup & Launch
color 0A

echo ===============================================================================
echo                     AGRISMART AUTOMATED SETUP & RUNNER
echo ===============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed on this system!
    echo Please download and install Node.js (v18 or v20+) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js detected:
node -v
echo.

:: 2. Check server/.env
if not exist "server\.env" (
    echo [2/3] WARNING: server\.env file was not found!
    echo Please create server\.env with your database and API credentials.
    echo.
) else (
    echo [2/3] server\.env found. Configuration ready!
)
echo.

:: 3. Install dependencies if node_modules are missing
if not exist "server\node_modules" (
    echo [3/3] Installing Backend Dependencies (npm install in server)...
    call npm --prefix server install
) else (
    echo [3/3] Backend dependencies already installed.
)

if not exist "client\node_modules" (
    echo     Installing Frontend Dependencies (npm install in client)...
    call npm --prefix client install
) else (
    echo     Frontend dependencies already installed.
)
echo.

:: 4. Start Backend and Frontend
echo Launching Backend Server on http://localhost:4000 ...
start "AgriSmart Backend (Port 4000)" cmd /k "npm --prefix server run dev"

echo Launching Frontend Client on http://localhost:5173 ...
start "AgriSmart Frontend (Port 5173)" cmd /k "npm --prefix client run dev"

echo.
echo ===============================================================================
echo            SUCCESS! AgriSmart is now starting up!
echo.
echo   - Backend API  : http://localhost:4000/api/health
echo   - Frontend Web : http://localhost:5173
echo ===============================================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
exit
