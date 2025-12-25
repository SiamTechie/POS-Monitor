@echo off
REM ========================================
REM Build POS Monitor as EXE
REM ========================================

echo.
echo ========================================
echo   Building POS Monitor EXE
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    pause
    exit /b 1
)

echo [1/3] Installing PyInstaller...
pip install pyinstaller --quiet
if errorlevel 1 (
    echo ERROR: Failed to install PyInstaller
    pause
    exit /b 1
)
echo    OK

echo.
echo [2/3] Building EXE file...
pyinstaller --onefile --noconsole --name "POS-Monitor" --icon=NONE monitor-rest-api.py
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo    OK

echo.
echo [3/3] Copying files...
if not exist "dist\POS-Monitor-Installer" mkdir "dist\POS-Monitor-Installer"
copy "dist\POS-Monitor.exe" "dist\POS-Monitor-Installer\"
copy "install-exe.bat" "dist\POS-Monitor-Installer\"
copy "config-template.txt" "dist\POS-Monitor-Installer\"
echo    OK

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo EXE file location:
echo dist\POS-Monitor-Installer\POS-Monitor.exe
echo.
echo Next steps:
echo 1. Copy folder "dist\POS-Monitor-Installer" to USB drive
echo 2. Distribute to branches
echo 3. Run install-exe.bat on each branch
echo.
pause
