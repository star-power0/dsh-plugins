# 生成自适应图标位图：前景（居中安全区）+ 背景（纯色）
# 源图 -> res/mipmap-*/ic_launcher_foreground.png + ic_launcher_background.png
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
$srcPath = 'D:\Manual\OneDrive\桌面\生图\imagestudio-history-1788511256608.png'
$bgHex = '#B6B6B5'          # 取源图边缘均值（实测）
$safe = 0.61                # 前景内容占画布比例（66dp/108dp 安全区）

$densities = @(
  # 必须是 drawable-* 而不是 mipmap-*：adaptive-icon 的
  # android:drawable 只能引用 drawable 资源（放 mipmap 会 link 报 not found）。
  @{ dir = 'drawable-mdpi';     size = 48 },
  @{ dir = 'drawable-hdpi';     size = 72 },
  @{ dir = 'drawable-xhdpi';    size = 96 },
  @{ dir = 'drawable-xxhdpi';   size = 144 },
  @{ dir = 'drawable-xxxhdpi';  size = 192 }
)

if (-not (Test-Path -LiteralPath $srcPath)) { throw "源图不存在: $srcPath" }
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$bgColor = [System.Drawing.ColorTranslator]::FromHtml($bgHex)

foreach ($d in $densities) {
  $outDir = Join-Path $root "res/$($d.dir)"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $n = $d.size

  # ---- 背景：纯色 ----
  $bg = New-Object System.Drawing.Bitmap($n, $n)
  $g = [System.Drawing.Graphics]::FromImage($bg)
  $g.Clear($bgColor)
  $g.Dispose()
  $bg.Save((Join-Path $outDir 'ic_launcher_background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $bg.Dispose()

  # ---- 前景：透明底 + 源图居中缩到安全区 ----
  $fg = New-Object System.Drawing.Bitmap($n, $n)
  $fg.MakeTransparent()
  $g = [System.Drawing.Graphics]::FromImage($fg)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $cw = [int][math]::Round($n * $safe)          # 内容边长
  $off = [int][math]::Round(($n - $cw) / 2)     # 居中偏移
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle($off, $off, $cw, $cw)))
  $g.Dispose()
  $fg.Save((Join-Path $outDir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $fg.Dispose()

  Write-Host ("{0,-16} {1}x{1}  (content {2}px @ offset {3})" -f $d.dir, $n, $cw, $off)
}

$src.Dispose()
Write-Host "DONE -> res/drawable-*/ic_launcher_foreground.png + ic_launcher_background.png"
