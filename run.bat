@echo off
set "PATH=C:\Users\raina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
echo ==========================================
echo  Starting Outbreak Radar Dev Server...
echo  Open: http://localhost:3000
echo ==========================================
"C:\Users\raina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "node_modules/next/dist/bin/next" dev -p 3000
pause
