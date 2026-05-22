# 导出全局高清 Logo（512x512 @3x 屏清晰）+ TabBar 单色 PNG（48x48）
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
# 集享官方 Logo：D:\xiangmu\jixianggongshe\jxgs.png
$logoCandidates = @(
  'D:\xiangmu\jixianggongshe\jxgs.png',
  (Join-Path $root 'jxgs.png'),
  'D:\xiangmu\jxgs.png',
  (Join-Path $root 'src\static\logo.png'),
  (Join-Path $root 'src\static\logo\logo.png')
)
$logoSrc = $logoCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $logoSrc) { throw 'Logo source not found' }

$logoOut = Join-Path $root 'src\static\logo.png'
$logoOutAlt = Join-Path $root 'src\static\logo\logo.png'
$tabDir = Join-Path $root 'src\static\tabbar'
# 全局 BrandLogo 最大展示约 120rpx≈60px，@3x 需 ~180px；512 留足锐度
$logoSize = 512
$tabSize = 48
$inactive = [System.Drawing.ColorTranslator]::FromHtml('#8A8A8A')
$active = [System.Drawing.ColorTranslator]::FromHtml('#9A7B4F')

$pngCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/png' } | Select-Object -First 1
$pngEncParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$pngEncParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Compression,
  [int64][System.Drawing.Imaging.EncoderValue]::CompressionLZW
)

function Save-Png($bmp, $path) {
  $dir = Split-Path $path -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if ($pngCodec) {
    $bmp.Save($path, $pngCodec, $pngEncParams)
  } else {
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
}

function Resize-Logo($srcPath, $outPath, $size) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = [Math]::Min($size / $src.Width, $size / $src.Height)
    $w = [int]($src.Width * $scale)
    $h = [int]($src.Height * $scale)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)
    $g.DrawImage($src, $x, $y, $w, $h)
    $g.Dispose()
    Save-Png $bmp $outPath
    $bmp.Dispose()
  } finally { $src.Dispose() }
}

function New-TabBitmap($name, $color) {
  $bmp = New-Object System.Drawing.Bitmap $tabSize, $tabSize
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $pen = New-Object System.Drawing.Pen $color, 2.2
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $brush = New-Object System.Drawing.SolidBrush $color
  $pad = 10
  $w = $tabSize - $pad * 2
  $h = $tabSize - $pad * 2
  switch ($name) {
    'home' {
      $pts = @(
        [System.Drawing.Point]::new($pad + [int]($w * 0.5), $pad + 2),
        [System.Drawing.Point]::new($pad + $w, $pad + [int]($h * 0.45)),
        [System.Drawing.Point]::new($pad + $w, $pad + $h),
        [System.Drawing.Point]::new($pad + [int]($w * 0.65), $pad + $h),
        [System.Drawing.Point]::new($pad + [int]($w * 0.65), $pad + [int]($h * 0.62)),
        [System.Drawing.Point]::new($pad + [int]($w * 0.35), $pad + [int]($h * 0.62)),
        [System.Drawing.Point]::new($pad + [int]($w * 0.35), $pad + $h),
        [System.Drawing.Point]::new($pad, $pad + $h),
        [System.Drawing.Point]::new($pad, $pad + [int]($h * 0.45))
      )
      $g.FillPolygon($brush, $pts)
      $g.DrawPolygon($pen, $pts)
    }
    'catalog' {
      $cell = [int]($w / 2.2)
      $gap = 3
      foreach ($row in 0..1) {
        foreach ($col in 0..1) {
          $rx = $pad + $col * ($cell + $gap)
          $ry = $pad + $row * ($cell + $gap)
          $g.DrawRectangle($pen, $rx, $ry, $cell, $cell)
        }
      }
    }
    'cart' {
      $g.DrawLine($pen, $pad, $pad + 6, $pad + $w, $pad + 6)
      $g.DrawLine($pen, $pad + 4, $pad + 6, $pad + 10, $pad + $h - 4)
      $g.DrawLine($pen, $pad + 10, $pad + $h - 4, $pad + $w - 2, $pad + $h - 4)
      $g.FillEllipse($brush, $pad + [int]($w * 0.28), $pad + $h - 6, 4, 4)
      $g.FillEllipse($brush, $pad + [int]($w * 0.68), $pad + $h - 6, 4, 4)
    }
    'wealth' {
      $pts = @(
        [System.Drawing.Point]::new($pad + 2, $pad + $h),
        [System.Drawing.Point]::new($pad + [int]($w * 0.3), $pad + [int]($h * 0.55)),
        [System.Drawing.Point]::new($pad + [int]($w * 0.5), $pad + [int]($h * 0.75)),
        [System.Drawing.Point]::new($pad + [int]($w * 0.72), $pad + [int]($h * 0.25)),
        [System.Drawing.Point]::new($pad + $w - 2, $pad + [int]($h * 0.4))
      )
      $g.DrawLines($pen, $pts)
    }
    'user' {
      $g.DrawEllipse($pen, $pad + [int]($w * 0.32), $pad + 2, [int]($w * 0.36), [int]($w * 0.36))
      $g.DrawArc($pen, $pad - 2, $pad + [int]($h * 0.42), $w + 4, [int]($h * 0.62), 200, 140)
    }
  }
  $pen.Dispose(); $brush.Dispose(); $g.Dispose()
  return $bmp
}

Write-Host "[optimize-assets] Logo source: $logoSrc"
Resize-Logo $logoSrc $logoOut $logoSize
Resize-Logo $logoSrc $logoOutAlt $logoSize
$logoBytes = (Get-Item $logoOut).Length
Write-Host "  logo.png   $logoBytes bytes ($logoSize x $logoSize)"

if (-not (Test-Path $tabDir)) { New-Item -ItemType Directory -Path $tabDir -Force | Out-Null }
$tabs = @('home', 'catalog', 'cart', 'wealth', 'user')
$totalTab = 0
foreach ($t in $tabs) {
  $bmp0 = New-TabBitmap $t $inactive
  $bmp1 = New-TabBitmap $t $active
  $p0 = Join-Path $tabDir "$t.png"
  $p1 = Join-Path $tabDir "$t-active.png"
  Save-Png $bmp0 $p0
  Save-Png $bmp1 $p1
  $bmp0.Dispose(); $bmp1.Dispose()
  $b0 = (Get-Item $p0).Length
  $b1 = (Get-Item $p1).Length
  $totalTab += $b0 + $b1
  Write-Host ("  {0,-22} {1} / {2} bytes" -f "$t.png", $b0, $b1)
}
Write-Host "  tabbar total: $totalTab bytes"
