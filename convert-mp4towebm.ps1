# convert-mp4towebm.ps1
# Convierte todos los videos .mp4 del directorio actual a .webm (VP9 + Opus)
# Elimina los MP4 originales solo si la conversión fue exitosa.

param(
    [int]$Crf = 30,
    [int]$AudioBitrate = 128,
    [int]$CpuUsed = 2
)

$ErrorActionPreference = "Stop"

function Test-Ffmpeg {
    try {
        $null = & ffmpeg -version 2>&1
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-Ffmpeg)) {
    Write-Host "`n[!] ffmpeg no está instalado." -ForegroundColor Red
    Write-Host "Opciones para instalarlo:" -ForegroundColor Yellow
    Write-Host "  1. winget install Gyan.FFmpeg"
    Write-Host "  2. choco install ffmpeg"
    Write-Host "  3. Descarga manual: https://github.com/BtbN/FFmpeg-Builds/releases"
    Write-Host "     (agrega ffmpeg al PATH después de instalar)`n"
    exit 1
}

$files = Get-ChildItem -Filter "*.mp4" -File
if ($files.Count -eq 0) {
    Write-Host "No se encontraron archivos .mp4 en el directorio actual." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n=== MP4 a WebM (VP9 + Opus) ===" -ForegroundColor Cyan
Write-Host "Archivos encontrados: $($files.Count)"
Write-Host "CRF: $Crf | Audio: ${AudioBitrate}k | cpu-used: $CpuUsed`n"

$exitos = 0
$fallos = 0

foreach ($file in $files) {
    $input  = $file.FullName
    $output = [System.IO.Path]::ChangeExtension($input, ".webm")

    Write-Host "Convirtiendo: $($file.Name) -> $([System.IO.Path]::GetFileName($output)) ..." -NoNewline

    try {
        & ffmpeg -y -i $input `
            -c:v libvpx-vp9 -crf $Crf -b:v 0 -cpu-used $CpuUsed -row-mt 1 -tile-columns 2 `
            -c:a libopus -b:a ${AudioBitrate}k -ac 2 `
            $output 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0 -and (Test-Path $output) -and (Get-Item $output).Length -gt 0) {
            Remove-Item $input -Force
            Write-Host " OK" -ForegroundColor Green
            $exitos++
        } else {
            if (Test-Path $output) { Remove-Item $output -Force }
            Write-Host " FALLO (ffmpeg error)" -ForegroundColor Red
            $fallos++
        }
    } catch {
        if (Test-Path $output) { Remove-Item $output -Force }
        Write-Host " FALLO ($($_.Exception.Message))" -ForegroundColor Red
        $fallos++
    }
}

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
Write-Host "Convertidos: $exitos" -ForegroundColor Green
Write-Host "Fallidos:    $fallos" -ForegroundColor $(if ($fallos -gt 0) { "Red" } else { "Green" })
Write-Host ""
