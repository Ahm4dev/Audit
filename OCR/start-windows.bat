@echo off
cd /d "%~dp0"
set PORT=8765
where python >nul 2>nul && (set PY=python) || (where py >nul 2>nul && (set PY=py) || (goto nopy))
start "" "http://localhost:%PORT%/doc-rebuilder.html"
%PY% -m http.server %PORT% --bind 127.0.0.1
goto :eof
:nopy
echo Python 3 is not installed. Install it from python.org, or open doc-rebuilder.html directly (needs internet the first time).
pause
