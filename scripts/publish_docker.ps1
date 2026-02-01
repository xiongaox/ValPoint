# ValPoint Docker Publish Script
# Purpose: Automate Docker build and push to Docker Hub
# Dependency: Docker Desktop must be running, and user must be logged in (docker login)

$ErrorActionPreference = "Stop"

function Get-PackageVersion {
    $packageJsonPath = Join-Path $PSScriptRoot "..\package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-Error "package.json not found."
    }
    $content = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    return $content.version
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "   ValPoint Docker Publish  " -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# 0. Check Docker status
Write-Host "`n[0/5] Checking Docker environment..."
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker is not running" }
    Write-Host "Docker is running." -ForegroundColor Green
} catch {
    Write-Error "Docker is not started or installed. Please start Docker Desktop first."
}

# 1. Get Input
$version = Get-PackageVersion
Write-Host "`nCurrent Project Version: $version" -ForegroundColor Yellow

$namespace = Read-Host "Enter Docker Hub Username (default: xiongaox)"
if ([string]::IsNullOrWhiteSpace($namespace)) {
    $namespace = "xiongaox"
}

$imageName = "valpoint_s"
$fullImageName = "$namespace/$imageName"

Write-Host "`nTarget Image: $fullImageName"
Write-Host "Tag 1: $version"
Write-Host "Tag 2: latest"

$confirm = Read-Host "`nConfirm build and push? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

# 2. Build Image
Write-Host "`n[1/5] Building Image (this may take a few minutes)..." -ForegroundColor Cyan
docker build -t $imageName .
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit }

# 3. Tag Image
Write-Host "`n[2/5] Tagging Image..." -ForegroundColor Cyan
# Fix: use literal 'latest' text, not variable
docker tag "${imageName}:latest" "${fullImageName}:${version}"
docker tag "${imageName}:latest" "${fullImageName}:latest"
Write-Host "Tags created." -ForegroundColor Green

# 4. Push Image
Write-Host "`n[3/5] Pushing to Docker Hub..." -ForegroundColor Cyan
Write-Host "Pushing $version..."
docker push "${fullImageName}:${version}"
if ($LASTEXITCODE -ne 0) { Write-Error "Push failed. Please run 'docker login' first."; exit }

Write-Host "Pushing latest..."
docker push "${fullImageName}:latest"

Write-Host "`n[SUCCESS] Publish Completed!" -ForegroundColor Green
Write-Host "Image URLs:"
Write-Host "  ${fullImageName}:${version}"
Write-Host "  ${fullImageName}:latest"
