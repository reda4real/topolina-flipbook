@echo off
set msg=%1
if "%msg%"=="" set msg="update"

git add .
git commit -m %msg%
git push
echo.
echo Pushed to GitHub with message: %msg%
