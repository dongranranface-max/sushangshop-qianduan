Get-ChildItem 'D:\xiangmu\jixianggongshe\qianduan\src\static' -Recurse -File | ForEach-Object {
    $kb = [math]::Round($_.Length / 1KB)
    $rel = $_.FullName.Replace('D:\xiangmu\jixianggongshe\qianduan\src\static\', '')
    Write-Host "$rel  ${kb}KB"
}
