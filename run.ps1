# Add Node runtime to PATH for current session
$env:PATH = "C:\Users\raina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;" + $env:PATH

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Outbreak Radar Dev Server...   " -ForegroundColor Green
Write-Host " Open: http://localhost:3000              " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

& "C:\Users\raina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "node_modules/next/dist/bin/next" dev -p 3000
