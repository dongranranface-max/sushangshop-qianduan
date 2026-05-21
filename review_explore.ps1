$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== 页面文件列表 ==="
Get-ChildItem "D:\xiangmu\001\src\pages" -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Replace("D:\xiangmu\001\src\", "")
    Write-Host "  $rel"
}

Write-Host ""
Write-Host "=== 组件文件列表 ==="
Get-ChildItem "D:\xiangmu\001\src\components" -File | ForEach-Object {
    Write-Host "  components/$($_.Name)"
}

Write-Host ""
Write-Host "=== 样式文件 ==="
Get-ChildItem "D:\xiangmu\001\src\styles" -Name | ForEach-Object {
    Write-Host "  styles/$_"
}

Write-Host ""
Write-Host "=== Config/Constants ==="
Get-ChildItem "D:\xiangmu\001\src\config" -Name | ForEach-Object {
    Write-Host "  config/$_"
}
Get-ChildItem "D:\xiangmu\001\src\constants" -Name | ForEach-Object {
    Write-Host "  constants/$_"
}

Write-Host ""
Write-Host "=== package.json 关键信息 ==="
$pkg = Get-Content "D:\xiangmu\001\package.json" | ConvertFrom-Json
Write-Host "  name: $($pkg.name)"
Write-Host "  version: $($pkg.version)"
Write-Host "  deps: $($pkg.dependencies.Count)"
Write-Host "  devDeps: $($pkg.devDependencies.Count)"
$pkg.dependencies | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notmatch "^(vue|@dcloudio|uni|vite|pinia)$" } | ForEach-Object {
    Write-Host "  dep: $($_.Name) = $($pkg.dependencies.($_.Name))"
}