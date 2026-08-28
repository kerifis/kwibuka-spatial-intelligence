@echo off
:: Kwibuka Spatial Intelligence - Vite Dev Server
:: Keeps the server running; restarts automatically if it crashes.

cd /d "%~dp0"

:restart
echo [%date% %time%] Starting Kwibuka dev server... >> "%~dp0server.log"
npm run dev >> "%~dp0server.log" 2>&1
echo [%date% %time%] Server stopped. Restarting in 5s... >> "%~dp0server.log"
timeout /t 5 /nobreak > nul
goto restart
