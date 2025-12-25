@echo off
chcp 65001 >nul
REM ========================================
REM POS Monitor - Simple Installer
REM ========================================

echo.
echo ========================================
echo   POS Monitor - Installation
echo ========================================
echo.

REM Check if POS-Monitor.exe exists in current directory
if not exist "%~dp0POS-Monitor.exe" (
    echo ERROR: POS-Monitor.exe not found!
    echo.
    echo Please make sure these files are in the same folder:
    echo   - POS-Monitor.exe
    echo   - install-simple.bat
    echo   - config-template.txt
    echo.
    echo Current folder: %~dp0
    pause
    exit /b 1
)

echo Examples of branch names:
echo   - สาขาสีลม
echo   - สาขาสยาม
echo   - สาขาเซ็นทรัล
echo.

REM Get branch name
:GET_BRANCH_NAME
set /p BRANCH_NAME="Enter your branch name: "

if "%BRANCH_NAME%"=="" (
    echo.
    echo ERROR: Branch name cannot be empty!
    echo.
    goto GET_BRANCH_NAME
)

REM Confirm
echo.
echo You entered: %BRANCH_NAME%
set /p CONFIRM="Is this correct? (Y/N): "

if /i not "%CONFIRM%"=="Y" (
    echo.
    goto GET_BRANCH_NAME
)

echo.
echo Installing for: %BRANCH_NAME%
echo.

REM Set paths
set SCRIPT_DIR=%~dp0
set INSTALL_DIR=C:\POS-Monitor

REM Create directory
echo [1/4] Creating directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo    Created: %INSTALL_DIR%

REM Copy EXE
echo.
echo [2/4] Copying files...
echo    Source: %SCRIPT_DIR%POS-Monitor.exe
echo    Destination: %INSTALL_DIR%\

copy /Y "%SCRIPT_DIR%POS-Monitor.exe" "%INSTALL_DIR%\POS-Monitor.exe"
if errorlevel 1 (
    echo.
    echo ERROR: Failed to copy POS-Monitor.exe
    echo.
    echo Troubleshooting:
    echo 1. Make sure you run this as Administrator
    echo 2. Check if POS-Monitor.exe exists in: %SCRIPT_DIR%
    echo 3. Check if you have write permission to C:\
    echo.
    pause
    exit /b 1
)
echo    Copied successfully!

REM Create config
echo.
echo [3/4] Creating configuration...
(
echo BRANCH_NAME=%BRANCH_NAME%
echo FIREBASE_URL=https://pos-monitor-7bcaf-default-rtdb.asia-southeast1.firebasedatabase.app
) > "%INSTALL_DIR%\config.txt"
echo    Created: config.txt
echo    Branch: %BRANCH_NAME%

REM Create auto-start task
echo.
echo [4/4] Setting up auto-start...
schtasks /query /tn "POS Monitor" >nul 2>&1
if not errorlevel 1 (
    echo    Removing old task...
    schtasks /delete /tn "POS Monitor" /f >nul
)

schtasks /create /tn "POS Monitor" /tr "%INSTALL_DIR%\POS-Monitor.exe" /sc onstart /ru SYSTEM /rl HIGHEST /f >nul
if errorlevel 1 (
    echo    WARNING: Could not create auto-start task
    echo    Please run this installer as Administrator
    echo.
    pause
    exit /b 1
)
echo    Auto-start configured!

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Branch Name: %BRANCH_NAME%
echo Install Location: %INSTALL_DIR%
echo.
echo The monitor will start now and run automatically on boot.
echo.
echo Dashboard:
echo https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
echo.
pause

REM Start the monitor
start "" "%INSTALL_DIR%\POS-Monitor.exe"

echo.
echo Monitor started!
echo You can close this window.
echo.
pause
