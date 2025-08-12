@echo off
echo ========================================
echo   Clinic Backend - Complete Installation
echo ========================================

echo.
echo [1/5] Installing core dependencies...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install --upgrade pip
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install fastapi==0.104.1 uvicorn[standard]==0.24.0

echo.
echo [2/5] Installing database dependencies...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install motor==3.3.2 pymongo==4.6.0

echo.
echo [3/5] Installing authentication dependencies...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install python-jose==3.3.0 passlib==1.7.4 bcrypt==4.3.0

echo.
echo [4/5] Installing remaining dependencies...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -m pip install -r requirements-minimal.txt

echo.
echo [5/5] Testing all critical imports...
"D:\dashboard-clinica\clinica\Scripts\python.exe" -c "import fastapi, motor, jose, passlib, bcrypt, unidecode; print('✓ All dependencies OK')"

echo.
echo ========================================
echo   Installation completed successfully!
echo   
echo   To start the server:
echo   D:\dashboard-clinica\clinica\Scripts\python.exe main.py
echo   
echo   API Documentation: http://localhost:8000/docs
echo ========================================
pause