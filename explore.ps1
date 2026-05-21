$ErrorActionPreference = "SilentlyContinue"
$base = "D:\xiangmu\001\src"

Write-Host "=== src/ 目录结构 ==="
Get-ChildItem $base -Name

Write-Host ""
Write-Host "=== pages/ ==="
Get-ChildItem "$base\pages" -Name

Write-Host ""
Write-Host "=== components/ ==="
Get-ChildItem "$base\components" -Name

Write-Host ""
Write-Host "=== styles/ ==="
if (Test-Path "$base\styles") {
    Get-ChildItem "$base\styles" -Name
}

Write-Host ""
Write-Host "=== dist/ 产物 ==="
Get-ChildItem "D:\xiangmu\001\dist" -Recurse -File | Select-Object FullName, Length | ForEach-Object {
    $rel = $_.FullName.Replace('D:\xiangmu\001\dist\', '')
    Write-Host "  $($_.Length) bytes - $rel"
}

Write-Host ""
Write-Host "=== index.html ==="
Get-Content "D:\xiangmu\001\index.html" -Raw