@echo off
REM One-shot Android dev loop: boot an emulator (if none is attached), then
REM build, install and start the app on it.
REM
REM   scripts\run-android.cmd                     first AVD, debug build
REM   scripts\run-android.cmd --variant release   extra args go to expo
REM
REM Set NG_AVD to choose a specific AVD; otherwise the first one is used.
setlocal enabledelayedexpansion

set "REPO_ROOT=%~dp0.."
set "BOOT_TIMEOUT=180"

REM --- Locate the SDK -------------------------------------------------------
set "SDK=%ANDROID_HOME%"
if not defined SDK set "SDK=%ANDROID_SDK_ROOT%"
if not defined SDK set "SDK=%LOCALAPPDATA%\Android\Sdk"

set "ADB=%SDK%\platform-tools\adb.exe"
set "EMULATOR=%SDK%\emulator\emulator.exe"

if not exist "%ADB%" (
  echo [run-android] adb not found at "%ADB%".
  echo [run-android] Set ANDROID_HOME to your Android SDK folder and retry.
  exit /b 1
)

REM --- Reuse an already-attached device, otherwise boot an emulator ---------
set "DEVICE="
for /f "usebackq skip=1 tokens=1,2" %%a in (`"%ADB%" devices`) do (
  if "%%b"=="device" if not defined DEVICE set "DEVICE=%%a"
)

if defined DEVICE echo [run-android] Using attached device !DEVICE!.
if not defined DEVICE call :boot_emulator
if errorlevel 1 exit /b 1

REM --- Port bridges ---------------------------------------------------------
REM 8081 lets the dev client reach Metro over localhost rather than depending
REM on the host's LAN IP being reachable from the emulator. 3000 is the local
REM backend (`npm start` in backend/) for anyone running it on the host.
"%ADB%" reverse tcp:8081 tcp:8081 >nul 2>&1
"%ADB%" reverse tcp:3000 tcp:3000 >nul 2>&1

REM --- Build, install, run --------------------------------------------------
cd /d "%REPO_ROOT%" || exit /b 1
echo [run-android] Building and installing...
call npx expo run:android %*
exit /b %errorlevel%


REM ==========================================================================
:boot_emulator
if not exist "%EMULATOR%" (
  echo [run-android] No device attached and no emulator at "%EMULATOR%".
  exit /b 1
)

set "AVD=%NG_AVD%"
if not defined AVD (
  for /f "usebackq delims=" %%a in (`"%EMULATOR%" -list-avds`) do (
    if not defined AVD set "AVD=%%a"
  )
)
if not defined AVD (
  echo [run-android] No AVDs found. Create one in Android Studio's Device Manager.
  exit /b 1
)

echo [run-android] Booting emulator !AVD! ...
REM Launched detached so it outlives this script - the next run then finds it
REM already attached and skips the cold boot entirely.
start "" /b "%EMULATOR%" -avd "!AVD!" -no-boot-anim

REM Polling sys.boot_completed rather than `adb wait-for-device`: the latter
REM returns as soon as adb sees the device, while the system server may still
REM be coming up, and installing into a half-booted device fails. It also
REM blocks forever if the emulator never appears, so this loop owns the timeout.
set /a WAITED=0
:wait_for_boot
set "BOOTED="
for /f "usebackq delims=" %%a in (`"%ADB%" shell getprop sys.boot_completed 2^>nul`) do set "BOOTED=%%a"
REM First character only: getprop's output carries a trailing CR.
if "!BOOTED:~0,1!"=="1" (
  echo [run-android] Emulator ready.
  exit /b 0
)
if !WAITED! GEQ %BOOT_TIMEOUT% (
  echo [run-android] Emulator did not finish booting within %BOOT_TIMEOUT%s.
  exit /b 1
)
REM `ping` rather than `timeout`, which refuses to run when stdin is redirected.
ping -n 4 127.0.0.1 >nul
set /a WAITED+=3
goto :wait_for_boot
