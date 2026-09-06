$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mongoRoot = Join-Path $projectRoot '.mongodb'
$dataPath = Join-Path $mongoRoot 'data'
$logPath = Join-Path $mongoRoot 'log\mongod.log'

New-Item -ItemType Directory -Force -Path $dataPath,(Split-Path $logPath) | Out-Null

function Test-MongoPort {
  $tcpClient = [System.Net.Sockets.TcpClient]::new()
  try {
    $connection = $tcpClient.BeginConnect('127.0.0.1', 27018, $null, $null)
    if (-not $connection.AsyncWaitHandle.WaitOne(500)) { return $false }
    $tcpClient.EndConnect($connection)
    return $true
  } catch {
    return $false
  } finally {
    $tcpClient.Dispose()
  }
}

if (Test-MongoPort) {
  Write-Output 'Local MongoDB is already running on port 27018.'
  exit 0
}

$mongoExe = Get-ChildItem 'C:\Program Files\MongoDB\Server\*\bin\mongod.exe' -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $mongoExe) {
  throw 'MongoDB Community Server was not found under C:\Program Files\MongoDB\Server.'
}

$process = Start-Process -FilePath $mongoExe -ArgumentList @(
  '--dbpath', $dataPath,
  '--port', '27018',
  '--bind_ip', '127.0.0.1',
  '--replSet', 'rs0',
  '--logpath', $logPath,
  '--logappend'
) -WindowStyle Hidden -PassThru

for ($attempt = 0; $attempt -lt 20; $attempt++) {
  Start-Sleep -Milliseconds 250
  if (Test-MongoPort) {
    Write-Output "Local MongoDB started (process $($process.Id))."
    exit 0
  }
}

throw "MongoDB did not start. Review $logPath"
