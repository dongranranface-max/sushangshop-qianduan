# 与线上一致预览：http://localhost:5173/mall/#/
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "dist\build\h5\index.html")) {
  Write-Host "Building H5..."
  npm run build:h5
}

$port = 5173
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1
Write-Host "Open (same as production path): http://localhost:$port/mall/"
Start-Process "http://localhost:$port/mall/"
node scripts/preview-mall.mjs
