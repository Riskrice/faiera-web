$source = "C:\Users\محمداشرفمغازىعبدهمتو\.gemini\antigravity\brain\4fdca1d1-5cd9-4f14-b869-64e43ce1bcb0\login_illustration_1768360806908.png"
$dest = "e:\faiera-web\public\assets\login-illustration.png"
New-Item -ItemType Directory -Force -Path "e:\faiera-web\public\assets"
Copy-Item -Path $source -Destination $dest -Force
Write-Host "Image copied successfully"
