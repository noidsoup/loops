# yin-llama-cpp-serve.ps1
# Run llama-server.exe against the Qwythos-Mythos GGUF on 0.0.0.0:8080.
# Exits 0 immediately after Start-Process returns; the running process is
# decoupled from this script's session. Health log goes to llama-server.log.

$ErrorActionPreference = 'Stop'

$ModelDir       = 'C:\Users\nicho\models\qwythos'
$ModelFile      = Join-Path $ModelDir 'Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf'
$LlamaCppDir    = 'C:\Users\nicho\llama.cpp'
$ServerExe      = Join-Path $LlamaCppDir 'llama-server.exe'
$LogDir         = 'C:\Users\nicho\llama-cpp'
$LogFile        = Join-Path $LogDir 'llama-server.log'
$Port           = 8080
$HostBind       = '0.0.0.0'
$CtxSize        = 8192
$GpuLayers      = 99          # full offload
$ParallelSlots  = 4           # 4 concurrent /v1/chat requests
$BatchSize      = 512
$UbatchSize     = 64
$FlashAttention = $true

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
if (-not (Test-Path $ModelFile)) {
    throw "Model not found at $ModelFile"
}
if (-not (Test-Path $ServerExe)) {
    throw "llama-server.exe not found at $ServerExe"
}

# Kill any stale instance from a previous boot or failed run. Ignore if not running.
Get-Process -Name 'llama-server' -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue

$arguments = @(
    '--model', "`"$ModelFile`"",
    '--host', $HostBind,
    '--port', $Port,
    '--ctx-size', $CtxSize,
    '--n-gpu-layers', $GpuLayers,
    '--parallel', $ParallelSlots,
    '--batch-size', $BatchSize,
    '--ubatch-size', $UbatchSize,
    '--jinja',
    '--reasoning-format', 'auto',
    '--log-format', 'json',
    '--log-disable',
    '--no-warmup'
) -replace '"', '\"'

if ($FlashAttention) {
    $arguments = @(
        '--model', "`"$ModelFile`"",
        '--host', $HostBind,
        '--port', $Port,
        '--ctx-size', $CtxSize,
        '--n-gpu-layers', $GpuLayers,
        '--parallel', $ParallelSlots,
        '--batch-size', $BatchSize,
        '--ubatch-size', $UbatchSize,
        '-fa',
        '--jinja',
        '--reasoning-format', 'auto',
        '--log-format', 'json',
        '--log-disable',
        '--no-warmup'
    ) -replace '"', '\"'
}

# Tee stdout+err to log file. Use Start-Process so we don't keep a handle and
# the process is fully detached from this PowerShell session.
$proc = Start-Process -FilePath $ServerExe `
    -ArgumentList $arguments `
    -WorkingDirectory $LlamaCppDir `
    -RedirectStandardOutput (Join-Path $LogDir 'llama-server.out.log') `
    -RedirectStandardError  (Join-Path $LogDir 'llama-server.err.log') `
    -WindowStyle Hidden `
    -PassThru

Write-Host ("Started llama-server PID={0} port={1} ctx={2}" -f $proc.Id, $Port, $CtxSize)
exit 0
