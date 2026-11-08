@echo off
setlocal
cd /d "%~dp0"
title wallBoard - Local Preview

echo.
echo ================================================
echo       wallBoard - RUN THE WEBSITE
echo ================================================
echo.
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        py -3 "run_server.py"
        goto :result
    )
)
where python >nul 2>nul
if %errorlevel%==0 (
    python -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        python "run_server.py"
        goto :result
    )
)
where python3 >nul 2>nul
if %errorlevel%==0 (
    python3 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        python3 "run_server.py"
        goto :result
    )
)

echo Python is not found. Starting with built-in Windows PowerShell...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_server_windows.ps1"

:result
if errorlevel 1 (
    echo.
    echo Please send a screenshot of this window if you see an error.
    pause
)
endlocal
