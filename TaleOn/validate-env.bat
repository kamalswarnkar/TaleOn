@echo off
setlocal enabledelayedexpansion

REM TaleOn Environment Validation Script for Windows
REM This script validates that all required environment variables are set for production deployment

echo 🔍 Validating TaleOn Environment Configuration...
echo.

REM Check if .env file exists and load it
if exist ".env" (
    echo 📄 Loading environment variables from .env file...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
    echo.
)

echo 🔧 Checking required environment variables...
set required_failed=0

call :check_var "NODE_ENV" "%NODE_ENV%" true
call :check_var "PORT" "%PORT%" true
call :check_var "MONGODB_URI" "%MONGODB_URI%" true
call :check_var "JWT_SECRET" "%JWT_SECRET%" true
call :check_var "SESSION_SECRET" "%SESSION_SECRET%" true
call :check_var "GROQ_API_KEY" "%GROQ_API_KEY%" true
call :check_var "FRONTEND_URL" "%FRONTEND_URL%" true

echo.
echo 🔧 Checking frontend environment variables...
call :check_var "VITE_API_URL" "%VITE_API_URL%" true
call :check_var "VITE_SOCKET_URL" "%VITE_SOCKET_URL%" true

echo.
echo 🔧 Checking optional environment variables...
call :check_var "EMAIL_USER" "%EMAIL_USER%" false
call :check_var "EMAIL_PASS" "%EMAIL_PASS%" false
call :check_var "GOOGLE_CLIENT_ID" "%GOOGLE_CLIENT_ID%" false
call :check_var "GOOGLE_CLIENT_SECRET" "%GOOGLE_CLIENT_SECRET%" false
call :check_var "OPENAI_API_KEY" "%OPENAI_API_KEY%" false

echo.
echo 🔍 Validating URL formats...
set url_validation_failed=0

if not "%FRONTEND_URL%"=="" call :validate_url "%FRONTEND_URL%" "FRONTEND_URL"
if not "%VITE_API_URL%"=="" call :validate_url "%VITE_API_URL%" "VITE_API_URL"
if not "%VITE_SOCKET_URL%"=="" call :validate_url "%VITE_SOCKET_URL%" "VITE_SOCKET_URL"

echo.
echo 🔍 Checking secret strength...
set secret_validation_failed=0

if not "%JWT_SECRET%"=="" call :check_secret_strength "%JWT_SECRET%" "JWT_SECRET"
if not "%SESSION_SECRET%"=="" call :check_secret_strength "%SESSION_SECRET%" "SESSION_SECRET"

echo.
echo 📊 Validation Summary:

set /a total_failed=%required_failed%+%url_validation_failed%+%secret_validation_failed%

if %total_failed%==0 (
    echo 🎉 All validations passed! Your environment is ready for deployment.
    echo.
    echo 📋 Next steps:
    echo    1. Run: docker-compose up -d
    echo    2. Check health: curl http://127.0.0.1:5000/health
    echo    3. Access your app at: %FRONTEND_URL%
    exit /b 0
) else (
    echo ❌ Validation failed with %total_failed% error^(s^)
    echo.
    echo 🔧 Fix the issues above before deploying.
    echo.
    echo 📋 Common fixes:
    echo    - Copy env.production.template to .env and fill in your values
    echo    - Generate strong secrets using online tools
    echo    - Ensure all URLs start with http:// or https://
    echo    - Set up your MongoDB database and get the connection string
    exit /b 1
)

REM Function to check if variable is set
:check_var
set var_name=%~1
set var_value=%~2
set required=%~3

if "%var_value%"=="" (
    if "%required%"=="true" (
        echo ❌ %var_name% is not set ^(REQUIRED^)
        set /a required_failed+=1
    ) else (
        echo ⚠️  %var_name% is not set ^(OPTIONAL^)
    )
) else (
    echo ✅ %var_name% is set
)
goto :eof

REM Function to validate URL format
:validate_url
set url=%~1
set name=%~2

echo %url% | findstr /r "^https\?://" >nul
if %errorlevel%==0 (
    echo ✅ %name% has valid URL format
) else (
    echo ❌ %name% has invalid URL format ^(must start with http:// or https://^)
    set /a url_validation_failed+=1
)
goto :eof

REM Function to check secret strength
:check_secret_strength
set secret=%~1
set name=%~2

set secret_len=0
for /f %%i in ('echo %secret% ^| powershell -command "$input | Measure-Object -Character | Select-Object -ExpandProperty Characters"') do set secret_len=%%i

if %secret_len% geq 32 (
    echo ✅ %name% is sufficiently long ^(%secret_len% characters^)
) else (
    echo ❌ %name% is too short ^(%secret_len% characters, minimum 32 required^)
    set /a secret_validation_failed+=1
)
goto :eof
