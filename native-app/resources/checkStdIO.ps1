$ErrorActionPreference = 'Stop'

$exe = Join-Path $PSScriptRoot '../build/native-app.exe'
if (-not (Test-Path -Path $exe -PathType Leaf)) {
  throw "native-app.exe not found at: $exe"
}

function Invoke-NativeMessage($exePath, $jsonText) {
  $p = [System.Diagnostics.Process]::new()
  $p.StartInfo.FileName = $exePath
  $p.StartInfo.WorkingDirectory = [System.IO.Path]::GetDirectoryName($exePath)
  $p.StartInfo.UseShellExecute = $false
  $p.StartInfo.RedirectStandardInput  = $true
  $p.StartInfo.RedirectStandardOutput = $true
  $null = $p.Start()

  # Write length (UInt32 LE) + UTF-8 JSON
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonText)
  $len   = [BitConverter]::GetBytes([UInt32]$bytes.Length)
  $p.StandardInput.BaseStream.Write($len, 0, 4)
  $p.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
  $p.StandardInput.Flush()
  $p.StandardInput.Close() # signal EOF so the app can respond and exit

  # Read response length
  $lenBuf = New-Object byte[] 4
  [void]$p.StandardOutput.BaseStream.Read($lenBuf, 0, 4)
  $respLen = [BitConverter]::ToUInt32($lenBuf, 0)

  # Read response body
  $respBuf = New-Object byte[] $respLen
  $read = 0
  while ($read -lt $respLen) {
    $r = $p.StandardOutput.BaseStream.Read($respBuf, $read, $respLen - $read)
    if ($r -le 0) { break }
    $read += $r
  }
  $p.WaitForExit()
  [System.Text.Encoding]::UTF8.GetString($respBuf, 0, $read)  
}

# Example
Invoke-NativeMessage $exe '{"action":"enum"}' | Write-Host
