@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".cache\tmp" mkdir ".cache\tmp"
set "TEMP=%CD%\.cache\tmp"
set "TMP=%TEMP%"
set "PYTHONUTF8=1"
call npm run import-balance
if errorlevel 1 goto failed
echo 请打开 http://127.0.0.1:5189 。若旧游戏正在运行，请先关闭旧服务。
call npm run dev
goto end
:failed
echo 应用失败：请检查表格数值，旧配置保持不变。
:end
pause
