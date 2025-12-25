@echo off
REM POS Monitor - Auto Start Script
REM This script runs the monitoring service

echo ========================================
echo  POS Connection Monitor
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/Update dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo.

REM Run monitor
echo Starting monitor...
echo.
python monitor.py

REM Deactivate on exit
deactivate
