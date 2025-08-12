@echo off
echo ========================================
echo  Clinic Backend - Step by Step Install
echo ========================================

echo.
echo [1/6] Updating pip...
python -m pip install --upgrade pip

echo.
echo [2/6] Installing core FastAPI dependencies...
pip install fastapi==0.104.1 uvicorn[standard]==0.24.0

echo.
echo [3/6] Installing database dependencies...
pip install motor==3.3.2 pymongo==4.6.0

echo.
echo [4/6] Installing basic dependencies...
pip install pydantic==2.11.7 pydantic-settings==2.1.0 python-dotenv==1.0.0

echo.
echo [5/6] Installing remaining core dependencies...
pip install -r requirements-minimal.txt

echo.
echo [6/6] Attempting to install security dependencies (may fail)...
pip install --only-binary=all cryptography bcrypt python-jose[cryptography] || echo "Security dependencies failed - using fallback auth"

echo.
echo ========================================
echo  Installation completed!
echo  Testing FastAPI import...
echo ========================================
python -c "import fastapi; print('✅ FastAPI successfully installed')" || echo "❌ FastAPI import failed"

echo.
echo "Run 'python main.py' to start the server"
pause