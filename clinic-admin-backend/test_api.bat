@echo off
echo Testing Admin API...
echo.

echo Step 1: Testing admin login...
curl -X POST "http://localhost:8000/api/auth/admin/login" ^
     -H "Content-Type: application/json" ^
     -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^
     -o login_response.json
echo.

echo Login response:
type login_response.json
echo.
echo.

echo Step 2: Extracting token...
for /f "tokens=2 delims=:" %%a in ('findstr "access_token" login_response.json') do (
    set "TOKEN=%%a"
)
set "TOKEN=%TOKEN:"=%"
set "TOKEN=%TOKEN:,=%"
echo Token extracted: %TOKEN%
echo.

echo Step 3: Testing subscription plans API...
curl -X GET "http://localhost:8000/api/admin/subscription-plans/" ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -o plans_response.json
echo.

echo Plans response:
type plans_response.json
echo.

echo Step 4: Checking response structure...
findstr "plan_id" plans_response.json
echo.

pause