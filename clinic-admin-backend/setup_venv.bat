@echo off
echo ========================================
echo   Clinic Backend - Virtual Environment Setup
echo ========================================

echo.
echo [1/4] Activating virtual environment...
cd /d "D:\dashboard-clinica"
call "clinica\Scripts\activate.bat"

echo.
echo [2/4] Navigating to backend directory...
cd "clinic-admin-backend"

echo.
echo [3/4] Installing all dependencies...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install --upgrade pip
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install -r requirements-minimal.txt
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install unidecode

echo.
echo [4/4] Testing imports...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -c "import fastapi, motor, jose, unidecode; print('All dependencies OK')"

echo.
echo ========================================
echo   Setup completed!
echo   To start the server, run:
echo   D:\dashboard-clinica\clinica\Scripts\python.exe main.py
echo ========================================
pause