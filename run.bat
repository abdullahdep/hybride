@echo off
echo Starting Backend and Frontend...

REM Backend terminal
start "Backend Server" cmd /k "call .\env\Scripts\activate && python -m backend.api_server"

REM Frontend terminal
start "Frontend App" cmd /k "call .\env\Scripts\activate && python frontend\app.py"

echo Both services are running in separate CMD Wait for openng CMD.