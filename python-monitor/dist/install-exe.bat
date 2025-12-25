@echo off
REM ========================================
REM POS Monitor - EXE Installer
REM ========================================

echo.
echo ========================================
echo   POS Monitor - Installation
echo ========================================
echo.
echo This installer will set up POS Monitor
echo to run automatically on this computer.
echo.

REM Show examples
echo Examples of branch names:
echo   - สาขาสีลม
echo   - สาขาสยาม
echo   - สาขาเซ็นทรัลพระราม9
echo   - สาขาเมกาบางนา
echo.

REM Get branch name
:GET_BRANCH_NAME
set /p BRANCH_NAME="Enter your branch name: "

REM Validate input
if "%BRANCH_NAME%"=="" (
    echo.
    echo ERROR: Branch name cannot be empty!
    echo Please enter a valid branch name.
    echo.
    goto GET_BRANCH_NAME
)

REM Confirm branch name
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

REM Create installation directory
set INSTALL_DIR=C:\POS-Monitor
echo [1/4] Creating directory...
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)
echo    Created: %INSTALL_DIR%

REM Copy EXE file
echo.
echo [2/4] Copying files...
copy "POS-Monitor.exe" "%INSTALL_DIR%\"
if errorlevel 1 (
    echo ERROR: Failed to copy files
    echo Please make sure you have administrator privileges
    pause
    exit /b 1
)
echo    Copied: POS-Monitor.exe

REM Create config file
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
    echo    You may need to run this installer as administrator
    echo.
    echo    Right-click install-exe.bat and select "Run as administrator"
    pause
    exit /b 1
) else (
    echo    Auto-start configured successfully
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Branch Name: %BRANCH_NAME%
echo Install Location: %INSTALL_DIR%
echo.
echo What happens next:
echo  1. The monitor will start now
echo  2. It will run automatically when Windows starts
echo  3. Check the dashboard to verify data is being sent
echo.
echo Dashboard URL:
echo https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
echo.
echo Press any key to start the monitor...
pause >nul

REM Start the monitor
start "" "%INSTALL_DIR%\POS-Monitor.exe"

echo.
echo Monitor started successfully!
echo.
echo You can close this window now.
echo The monitor is running in the background.
echo.
pause

