# 从正确目录启动 H5 预览，避免白屏
$root = Split-Path -Parent $PSScriptRoot
$h5 = Join-Path $root "dist\build\h5"
$port = 5173

if (-not (Test-Path (Join-Path $h5 "index.html"))) {
  Write-Host "Building H5..."
  Set-Location $root
  npm run build:h5
}

Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1
Set-Location $h5
Write-Host "Serving: $h5"
Write-Host "Open: http://localhost:$port/"
Start-Process "http://localhost:$port/"
npx --yes serve -s -l $port
