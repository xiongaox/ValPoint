param(
  [string]$InputDir = "public/maps/covers",
  [string]$OutputDir = "",
  [int]$Quality = 85,
  [switch]$Lossless,
  [switch]$Force,
  [switch]$Replace
)

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = $InputDir
}

if (-not (Test-Path -Path $InputDir)) {
  Write-Error "InputDir not found: $InputDir"
  exit 1
}

if (-not (Test-Path -Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$magick = Get-Command magick -ErrorAction SilentlyContinue
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue

if (-not $magick -and -not $ffmpeg) {
  Write-Error "No converter found. Install ImageMagick (magick) or ffmpeg, then retry."
  exit 1
}

$files = Get-ChildItem -Path $InputDir -Filter *.png -File
if ($files.Count -eq 0) {
  Write-Host "No PNG files found in $InputDir"
  exit 0
}

$converted = 0
$skipped = 0
$totalOutBytes = 0

foreach ($file in $files) {
  $outPath = Join-Path $OutputDir ([IO.Path]::ChangeExtension($file.Name, ".webp"))

  if (-not $Force -and (Test-Path -Path $outPath)) {
    $outInfo = Get-Item -Path $outPath
    if ($outInfo.LastWriteTime -ge $file.LastWriteTime) {
      $skipped++
      continue
    }
  }

  if ($magick) {
    if ($Lossless) {
      & $magick.Source "`"$($file.FullName)`"" -define webp:lossless=true "`"$outPath`""
    } else {
      & $magick.Source "`"$($file.FullName)`"" -quality $Quality -define webp:method=6 "`"$outPath`""
    }
  } else {
    if ($Lossless) {
      & $ffmpeg.Source -y -i "`"$($file.FullName)`"" -c:v libwebp -lossless 1 "`"$outPath`""
    } else {
      & $ffmpeg.Source -y -i "`"$($file.FullName)`"" -c:v libwebp -qscale $Quality -preset picture "`"$outPath`""
    }
  }

  if (-not (Test-Path -Path $outPath)) {
    Write-Error "Failed to convert: $($file.FullName)"
    exit 1
  }

  if ($Replace) {
    Remove-Item -Path $file.FullName -Force
  }

  $outSize = (Get-Item -Path $outPath).Length
  $totalOutBytes += $outSize
  $converted++
}

Write-Host "Done. Converted: $converted, Skipped: $skipped, Output bytes: $totalOutBytes"
