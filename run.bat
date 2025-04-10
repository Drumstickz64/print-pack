@echo off
setlocal

rem Get the directory of the script
set "script_dir=%~dp0"

rem Check if node_modules directory exists
if exist "%script_dir%node_modules" (
    node .
    pause
) else (
    echo installing dependencies.
    npm i
    node .
    pause
)


endlocal
