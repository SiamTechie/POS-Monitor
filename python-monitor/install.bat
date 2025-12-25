@echo off
REM ========================================
REM POS Monitor - One-Click Installer
REM Auto-install everything needed
REM ========================================

echo.
echo ========================================
echo   POS Monitor - Auto Installer
echo ========================================
echo.

REM Get branch name from WordPress user
set BRANCH_NAME=%USERNAME%

REM Configuration
set INSTALL_DIR=C:\POS-Monitor
set FIREBASE_URL=https://YOUR-PROJECT.firebaseio.com
set DOWNLOAD_URL=https://github.com/SiamTechie/POS-Monitor/raw/main/python-monitor

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python first:
    echo 1. Go to: https://www.python.org/downloads/
    echo 2. Download Python 3.8 or higher
    echo 3. Run installer and CHECK "Add Python to PATH"
    echo 4. Run this installer again
    echo.
    pause
    exit /b 1
)
echo    OK - Python is installed

echo.
echo [2/6] Creating installation directory...
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo    Created: %INSTALL_DIR%
) else (
    echo    Already exists: %INSTALL_DIR%
)

echo.
echo [3/6] Downloading files from GitHub...
cd /d "%INSTALL_DIR%"

REM Download files using PowerShell
powershell -Command "& {Invoke-WebRequest -Uri '%DOWNLOAD_URL%/monitor.py' -OutFile 'monitor.py'}" 2>nul
if errorlevel 1 (
    echo    ERROR: Failed to download monitor.py
    echo    Please check your internet connection
    pause
    exit /b 1
)
echo    Downloaded: monitor.py

powershell -Command "& {Invoke-WebRequest -Uri '%DOWNLOAD_URL%/requirements.txt' -OutFile 'requirements.txt'}" 2>nul
echo    Downloaded: requirements.txt

powershell -Command "& {Invoke-WebRequest -Uri '%DOWNLOAD_URL%/start-monitor.bat' -OutFile 'start-monitor.bat'}" 2>nul
echo    Downloaded: start-monitor.bat

powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/SiamTechie/POS-Monitor/raw/main/firebase-credentials.json' -OutFile 'firebase-credentials.json'}" 2>nul
echo    Downloaded: firebase-credentials.json

echo.
echo [4/6] Configuring for this branch: %BRANCH_NAME%
REM Update branch name in monitor.py
powershell -Command "(Get-Content monitor.py) -replace \"'BRANCH_NAME': 'สาขาทดสอบ'\", \"'BRANCH_NAME': '%BRANCH_NAME%'\" | Set-Content monitor.py"
powershell -Command "(Get-Content monitor.py) -replace 'YOUR-PROJECT.firebaseio.com', '%FIREBASE_URL%' | Set-Content monitor.py"
echo    Configured for: %BRANCH_NAME%

echo.
echo [5/6] Installing Python dependencies...
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo    ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo    Dependencies installed

echo.
echo [6/6] Creating Windows Task for auto-start...
schtasks /query /tn "POS Monitor" >nul 2>&1
if not errorlevel 1 (
    echo    Removing old task...
    schtasks /delete /tn "POS Monitor" /f >nul
)

schtasks /create /tn "POS Monitor" /tr "%INSTALL_DIR%\start-monitor.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f >nul
if errorlevel 1 (
    echo    WARNING: Could not create auto-start task
    echo    You may need administrator privileges
) else (
    echo    Auto-start task created
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Branch Name: %BRANCH_NAME%
echo Install Location: %INSTALL_DIR%
echo.
echo The monitor will start automatically when Windows boots.
echo.
echo To start now, run: %INSTALL_DIR%\start-monitor.bat
echo.
echo Press any key to start the monitor now...
pause >nul

REM Start the monitor
start "" "%INSTALL_DIR%\start-monitor.bat"

echo.
echo Monitor started! Check the window for status.
echo.
pause
