@echo off
echo ========================================
echo   CRM Application - Quick Start
echo ========================================
echo.

echo [1/3] Setting up Prisma (generate + db push + seed)...
cd server
call npx prisma generate
if errorlevel 1 goto prisma_fail
call npx prisma db push
if errorlevel 1 goto prisma_fail
call node prisma/seed.js
if errorlevel 1 goto prisma_fail
cd ..
echo Prisma setup complete.
echo.

echo [2/3] Starting Backend Server...
cd server
start "CRM Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

cd ..
echo [3/3] Starting Frontend Server...
start "CRM Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Default logins (see README.md):
echo   admin@crm.com / admin123
echo   manager@crm.com / manager123
echo   sales@crm.com / sales123
echo.
echo Press any key to exit this window...
pause >nul
goto end

:prisma_fail
echo.
echo ========================================
echo   Prisma setup failed
echo ========================================
echo Make sure server/.env has DATABASE_URL and the database is reachable.
echo Then run again.
echo.
pause

:end