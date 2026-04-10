$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "frontend"
$venvPython = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
  Write-Error "Не найден Python в .venv: $venvPython"
}

$backendCommand = @"
Set-Location '$root'
& '$venvPython' -m uvicorn backend.main:app --reload --port 8000
"@

$frontendCommand = @"
Set-Location '$frontendDir'
if (-not (Test-Path '.\node_modules')) {
  npm install
}
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null

Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:3000"
