@echo off
echo ========================================
echo   CRM Application - Quick Start
echo ========================================
echo.

echo [1/2] Starting Backend Server...
cd server
start "CRM Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

cd ..
echo [2/2] Starting Frontend Server...
start "CRM Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Login with: admin@crm.com / 123456
echo.
echo Press any key to exit this window...
pause >nul
