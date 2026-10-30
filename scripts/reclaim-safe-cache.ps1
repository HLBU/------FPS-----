$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$recoveryRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'outputs\recovered-cache-20261030'))
if (-not $recoveryRoot.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Invalid recovery directory' }
if (Test-Path -LiteralPath (Join-Path $recoveryRoot 'manifest.json')) { throw 'A recovery manifest already exists. Preserve it and use a new recovery directory for another cleanup.' }
New-Item -ItemType Directory -Path $recoveryRoot -Force | Out-Null
$before = (Get-PSDrive C).Free
$items = [System.Collections.Generic.List[object]]::new()
$sources = @()
if (-not (Get-Process -ErrorAction SilentlyContinue | Where-Object ProcessName -Match 'wemeet|tencentmeeting')) {
  $sources += @{ Root='C:\Users\sx_71\AppData\Local\Temp\Tencent\Wemeet\Temp'; Label='TencentMeeting'; Filter='*.tmp'; Hours=8 }
}
$sources += @{ Root='C:\Users\sx_71\AppData\Local\Microsoft\Edge\User Data\component_crx_cache'; Label='EdgeComponentDownloads'; Filter='*'; Hours=24 }
$sources += @{ Root='C:\Users\sx_71\AppData\Local\Google\Chrome\User Data\component_crx_cache'; Label='ChromeComponentDownloads'; Filter='*'; Hours=24 }
foreach ($source in $sources) {
  if (-not (Test-Path -LiteralPath $source.Root)) { continue }
  $allowedRoot = (Resolve-Path -LiteralPath $source.Root).Path
  foreach ($file in (Get-ChildItem -LiteralPath $allowedRoot -File -Filter $source.Filter -Force)) {
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    if ($source.Label -ne 'TencentMeeting' -and $file.Name -notmatch '^[A-Fa-f0-9]{64}$') { continue }
    if ($file.LastWriteTime -gt (Get-Date).AddHours(-$source.Hours) -or $file.Length -lt 1048576) { continue }
    $absolute = [IO.Path]::GetFullPath($file.FullName)
    if (-not $absolute.StartsWith($allowedRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'File escaped allowed cache root' }
    $targetDirectory = Join-Path $recoveryRoot $source.Label
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    $target = Join-Path $targetDirectory $file.Name
    $inputStream=$null; $outputStream=$null
    try {
      # Exclusive access proves this download/temp file is not currently held open.
      $inputStream=[IO.File]::Open($absolute,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None)
      $outputStream=[IO.File]::Open($target,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
      $inputStream.CopyTo($outputStream); $outputStream.Flush($true); $outputStream.Dispose(); $outputStream=$null
      $inputStream.Position=0
      $sha=[Security.Cryptography.SHA256]::Create()
      $sourceHash=[Convert]::ToHexString($sha.ComputeHash($inputStream)); $sha.Dispose()
      $targetHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
      if ($sourceHash -ne $targetHash) { throw 'Recovery copy hash mismatch' }
      $inputStream.Dispose();$inputStream=$null
      $current=Get-Item -LiteralPath $absolute
      if ($current.Length -ne $file.Length -or $current.LastWriteTimeUtc -ne $file.LastWriteTimeUtc) { throw 'Source changed; retained original' }
      Remove-Item -LiteralPath $absolute
      $items.Add([pscustomobject]@{source=$absolute;recovery=$target;bytes=$file.Length;sha256=$sourceHash;status='moved'})
    } catch {
      $items.Add([pscustomobject]@{source=$absolute;recovery=$target;bytes=0;status='skipped';reason=$_.Exception.Message})
    } finally {
      if ($inputStream) {$inputStream.Dispose()};if ($outputStream) {$outputStream.Dispose()}
    }
  }
}
$result=[pscustomobject]@{beforeFree=$before;afterFree=(Get-PSDrive C).Free;movedBytes=($items | Where-Object status -eq 'moved' | Measure-Object bytes -Sum).Sum;files=$items}
$result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $recoveryRoot 'manifest.json') -Encoding utf8
$result | Select-Object beforeFree,afterFree,movedBytes,@{Name='movedFiles';Expression={@($_.files | Where-Object status -eq 'moved').Count}},@{Name='skippedFiles';Expression={@($_.files | Where-Object status -eq 'skipped').Count}} | ConvertTo-Json
