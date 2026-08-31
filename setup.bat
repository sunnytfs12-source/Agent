@echo off
echo ============================================================
echo   MSCIT Todo App - Full Setup
echo ============================================================
echo.

:: ── Step 1: Frontend dependencies ───────────────────────────
echo [1/4] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Frontend npm install failed.
  pause
  exit /b 1
)
echo Frontend dependencies installed.
echo.

:: ── Step 2: Backend dependencies ────────────────────────────
echo [2/4] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Backend npm install failed.
  cd ..
  pause
  exit /b 1
)

:: ── Step 3: Create data folder for SQLite ───────────────────
echo [3/4] Creating SQLite data folder...
cd backend
if not exist "data" mkdir data
cd ..
echo SQLite data folder ready: backend\data\

:: ── Step 4: Copy .env files if they don't exist ─────────────
echo [4/4] Checking environment files...
cd ..

if not exist ".env" (
  echo VITE_API_URL=http://localhost:5000/api > .env
  echo Created frontend .env
) else (
  echo Frontend .env already exists - skipped.
)

if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo Created backend\.env from .env.example
) else (
  echo Backend .env already exists - skipped.
)

echo.
echo ============================================================
echo   Setup complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Run database migration (creates all tables):
echo         cd backend ^&^& npm run db:migrate
echo.
echo   2. Seed the database (creates admin account):
echo         npm run db:seed
echo.
echo   3. Start the backend (Terminal 1):
echo         cd backend ^&^& npm run dev
echo.
echo   4. Start the frontend (Terminal 2):
echo         npm run dev
echo.
echo   Default admin login after seeding:
echo     Email   : admin@mscit.dev
echo     Password: Admin@1234
echo.
echo   NOTE: No PostgreSQL needed! The database is a single
echo         file at:  backend\data\mscit_todo.db
echo.
pause
