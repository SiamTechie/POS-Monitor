@echo off
chcp 65001 >nul
title POS Monitor Installer

echo.
echo ==========================================
echo   POS Monitor - Silent Background Service
echo ==========================================
echo.

:: Check if config.txt exists
if not exist "%~dp0config.txt" (
    echo [ERROR] ไม่พบไฟล์ config.txt!
    echo กรุณาสร้างไฟล์ config.txt และใส่ชื่อสาขา
    echo.
    pause
    exit /b 1
)

:: Create installation folder
set INSTALL_DIR=C:\POS-Monitor
echo [1/4] Creating installation folder: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copy files
echo [2/4] Copying files...
copy /Y "%~dp0POS-Monitor-Silent.exe" "%INSTALL_DIR%\" >nul
copy /Y "%~dp0config.txt" "%INSTALL_DIR%\" >nul

:: Create startup shortcut
echo [3/4] Setting up auto-start...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_FOLDER%\POS-Monitor.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\POS-Monitor-Silent.exe" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "POS Monitor Silent Service" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

:: Start the monitor
echo [4/4] Starting POS Monitor...
start "" /B "%INSTALL_DIR%\POS-Monitor-Silent.exe"

echo.
echo ==========================================
echo   Installation Complete!
echo ==========================================
echo.
echo Location: %INSTALL_DIR%
echo Log file: %INSTALL_DIR%\monitor.log
echo.
echo POS Monitor is now running in background.
echo It will start automatically on Windows startup.
echo.
pause
