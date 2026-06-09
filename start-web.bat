@echo off
setlocal

cd /d "%~dp0"

start /b npm run dev:server
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"
npm run dev

call :cleanup_port 3000
call :cleanup_port 5173

endlocal
exit /b

:cleanup_port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%1 .*LISTENING"') do (
  taskkill /f /pid %%a >nul 2>nul
)
exit /b
