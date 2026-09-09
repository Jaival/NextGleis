@echo off
REM Native Android release build. `app.json`'s withShortCxxPath plugin
REM redirects CMake's .cxx staging dir to a short path (C:\rnb\nextgleis)
REM during prebuild, working around a Windows-only ninja/CMake object-path
REM length bug triggered by react-native-reanimated's deep source tree.
setlocal
set "REPO_ROOT=%~dp0.."

cd /d "%REPO_ROOT%" || exit /b 1
call npx expo prebuild -p android --clean
if errorlevel 1 exit /b 1

cd /d "%REPO_ROOT%\android" || exit /b 1
call .\gradlew.bat assembleRelease
