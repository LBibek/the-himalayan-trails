Add-Type -AssemblyName System.Drawing

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)

$jpgFiles = Get-ChildItem -Path public -Recurse -Filter *.jpg
foreach ($file in $jpgFiles) {
    $tempPath = $file.FullName + ".tmp"
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $img.Save($tempPath, $jpegEncoder, $encoderParams)
    $img.Dispose()
    
    $origKB = [math]::Round($file.Length / 1KB, 1)
    $newKB = [math]::Round((Get-Item $tempPath).Length / 1KB, 1)
    Move-Item -Force $tempPath $file.FullName
    Write-Host "$($file.Name): $origKB KB -> $newKB KB"
}

# For logo.png, resize to 256x256 high quality
$logoFile = Get-Item "public\logo.png"
if (Test-Path $logoFile) {
    $img = [System.Drawing.Image]::FromFile($logoFile.FullName)
    $newBmp = New-Object System.Drawing.Bitmap(256, 256)
    $graphics = [System.Drawing.Graphics]::FromImage($newBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($img, 0, 0, 256, 256)
    $graphics.Dispose()
    $img.Dispose()
    
    $tempPath = $logoFile.FullName + ".tmp"
    $newBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newBmp.Dispose()
    
    $origKB = [math]::Round($logoFile.Length / 1KB, 1)
    $newKB = [math]::Round((Get-Item $tempPath).Length / 1KB, 1)
    Move-Item -Force $tempPath $logoFile.FullName
    Write-Host "$($logoFile.Name): $origKB KB -> $newKB KB"
}
