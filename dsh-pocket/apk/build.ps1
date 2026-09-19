# DSH Pocket APK one-shot build: aapt2 -> javac -> d8 -> zip -> zipalign -> apksigner.
# No Gradle, no androidx. Requires: JDK17 (JAVA_HOME) + Android SDK build-tools/platforms.
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$bt = 'D:\DevTools\AndroidSDK\build-tools\36.1.0'
$jar = 'D:\DevTools\AndroidSDK\platforms\android-34\android.jar'
$build = Join-Path $root 'build'
$ks = Join-Path $root 'pocket.keystore'
$ksPass = 'pocket123'

New-Item -ItemType Directory -Force "$build\gen","$build\classes","$build\dex" | Out-Null

Write-Host '[1/6] aapt2 compile'
& "$bt\aapt2.exe" compile --dir (Join-Path $root 'res') -o "$build\res.zip"
if ($LASTEXITCODE) { throw 'aapt2 compile failed' }

Write-Host '[2/6] aapt2 link'
& "$bt\aapt2.exe" link -o "$build\pocket-unsigned.apk" -I $jar `
  --manifest (Join-Path $root 'AndroidManifest.xml') `
  --min-sdk-version 24 --target-sdk-version 34 `
  -R "$build\res.zip" --java "$build\gen" --auto-add-overlay
if ($LASTEXITCODE) { throw 'aapt2 link failed' }

Write-Host '[3/6] javac'
& javac -encoding UTF-8 -source 11 -target 11 -nowarn `
  -classpath $jar `
  -d "$build\classes" `
  (Join-Path $build 'gen\com\dsh\pocket\R.java') `
  (Join-Path $root 'java\com\dsh\pocket\MainActivity.java')
if ($LASTEXITCODE) { throw 'javac failed' }

Write-Host '[4/6] d8'
& "$bt\d8.bat" --release --lib $jar --output "$build\dex" `
  (Get-ChildItem "$build\classes\com\dsh\pocket" -Filter *.class | ForEach-Object { $_.FullName })
if ($LASTEXITCODE) { throw 'd8 failed' }

Write-Host '[5/6] pack dex into apk + zipalign'
Copy-Item "$build\pocket-unsigned.apk" "$build\pocket.apk" -Force
Push-Location "$build\dex"
& jar -uf "$build\pocket.apk" classes.dex
if ($LASTEXITCODE) { throw 'jar pack failed' }
Pop-Location
& "$bt\zipalign.exe" -f -p 4 "$build\pocket.apk" "$build\pocket-aligned.apk"
if ($LASTEXITCODE) { throw 'zipalign failed' }

Write-Host '[6/6] sign'
if (-not (Test-Path $ks)) {
  & keytool -genkeypair -v -keystore $ks -alias pocket -keyalg RSA -keysize 2048 `
    -validity 10000 -storepass $ksPass -keypass $ksPass `
    -dname 'CN=DSH Pocket' 2>&1 | Out-Null
  if ($LASTEXITCODE) { throw 'keytool failed' }
}
$signed = Join-Path $root 'DSH-Pocket-v1.2.apk'
& "$bt\apksigner.bat" sign --ks $ks --ks-pass "pass:$ksPass" --key-pass "pass:$ksPass" --out $signed "$build\pocket-aligned.apk"
if ($LASTEXITCODE) { throw 'apksigner failed' }
& "$bt\apksigner.bat" verify $signed
Write-Host "DONE -> $signed ($([math]::Round((Get-Item $signed).Length/1KB)) KB)"
