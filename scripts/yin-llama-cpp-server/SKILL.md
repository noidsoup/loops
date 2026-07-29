---
name: yin-llama-cpp-server
title: Yin llama.cpp server - persistent Qwythos-Mythos endpoint on RTX 4070 Win 11 box
description: Run llama-server.exe as a LAN-reachable OpenAI-compatible endpoint on YIN (192.168.1.163:8910) serving the Qwythos-Mythos 9B Q5_K_M GGUF. Replace, restart, and validate the server with smoke tests.
triggers:
  - "Yin isn't serving llama-server"
  - "Restart Qwythos on Yin"
  - "Local LLM endpoint at 192.168.1.163:8910"
  - "Qwythos server is down"
prerequisites:
  - SSH access: ssh -i ~/.ssh/id_ed25519_yin nicho@192.168.1.163
  - llama.cpp build at C:\Users\nicho\llama.cpp\llama-server.exe (b10091+)
  - Qwythos GGUF at C:\Users\nicho\models\qwythos\
  - PowerShell as default SSH shell
  - RTX 4070 12 GB VRAM box (Win 11 24H2)
---

# Yin llama.cpp Server (Qwythos-Mythos)

Replaces the retired `yin-ollama-sandbox` skill. We do not run Ollama anywhere
on YIN anymore — the production LLM endpoint on this box is a native
`llama-server.exe` serving Qwythos-Mythos directly.

## Target Hardware (YIN)

- CPU: i7-13700F (16C/24T)
- GPU: NVIDIA GeForce RTX 4070, 12 GB VRAM
- RAM: 16 GB total
- Disk: ~200 GB free on C:\
- Network: 192.168.1.163 on Wi-Fi

## Endpoint

- Base URL: `http://192.168.1.163:8910/v1` (OpenAI-compat)
- Model: `C:\Users\nicho\models\qwythos\Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf`
- Server build: llama.cpp b10091

## Quick Start

The server is launched and supervised by the `LlamaServerQwythos` scheduled
task. It runs on logon with `RestartCount=3, RestartInterval=PT1M,
MultipleInstancesPolicy=IgnoreNew, ExecutionTimeLimit=PT72H`.

Restart manually:

```powershell
schtasks /Run /TN LlamaServerQwythos
```

Verify from the Mac:

```bash
curl -s http://192.168.1.163:8910/v1/models | python3 -m json.tool | head -30
curl -s http://192.168.1.163:8910/health
```

## Critical Pitfalls

### 1. Always include `--reasoning-preserve`

Without this flag the Qwythos-Mythos chat template strips the answer into
`message.reasoning_content` and emits `message.content: ""`. Symptom: model
gives a long reasoning trace then "no answer." The build (b10091) supports
the flag explicitly because the template logs the hint at startup:

```
chat template supports preserving reasoning, consider enabling it via --reasoning-preserve
```

The scheduled task arguments include this flag. Don't strip it on restarts.

### 2. VRAM thrash on rapid restarts

`Stop-Process -Name llama-server -Force` then immediate relaunch can leave CUDA
caches holding the previous model's footprint even after the process is gone.
`nvidia-smi --query-gpu=memory.used` will report ~11 GB used with no owning
process. Wait 30s; the cache flushes itself, or the next launch will fail and
need a second attempt.

### 3. Don't try two copies of the 9B at once

The model is ~6.3 GB on disk, ~9.5 GB on the GPU at load. The card has 12 GB
total. Two copies (different ports, same model) will OOM or fail with cryptic
errors. Swap, don't parallel.

### 4. Server dies when SSH-launched PowerShell returns

`Start-Process -WindowStyle Hidden` from an SSH-launched PowerShell gets killed
when SSH returns. The scheduled task fixes this by running the launcher as a
logon-triggered task under the user's interactive session.

If you need to launch once outside the task for testing:

```powershell
Start-Process -FilePath 'C:\Users\nicho\llama.cpp\llama-server.exe' `
  -ArgumentList '-m','C:\Users\nicho\models\qwythos\Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf','--host','0.0.0.0','--port','8910','--n-gpu-layers','999','--ctx-size','32768','--jinja','--reasoning-preserve' `
  -WorkingDirectory 'C:\Users\nicho\llama.cpp' `
  -WindowStyle Hidden -RedirectStandardOutput 'C:\Users\nicho\llama-cpp\manual.out.log' `
  -RedirectStandardError 'C:\Users\nicho\llama-cpp\manual.err.log'
```

### 5. CUDA error after rapid-fire chat

Multiple `/v1/chat/completions` calls in <100 ms with the server still warming up
will return 503 with `error.message: "Loading model"`. Wait 5-10 s and retry.

### 6. Firewall blocks LAN access on Public profile

First-connection worked, then subsequent ones time out — Wi-Fi networks are
classified Public by default and the `llama.cpp server` firewall rule must be
on `Any` profile. The rule was created during initial setup; verify with:

```powershell
Get-NetFirewallRule -DisplayName 'llama.cpp server' | Get-NetFirewallPortFilter
# Expect: LocalPort = 8910, Protocol = TCP
```

### 7. PowerShell `$` and `\` over SSH

Bash double-quote expansion eats `$` and `\`. Use single-quoted PowerShell
arguments or stage the script to a `.ps1` file and execute via `-File`.

## Smoke Test

Run a real OpenAI-compat inference. With the server healthy:

```bash
ssh -i ~/.ssh/id_ed25519_yin nicho@192.168.1.163 \
  "powershell -NoProfile -Command \
   '(Invoke-WebRequest -Method POST -Uri http://127.0.0.1:8910/v1/chat/completions -Headers @{''Content-Type''=''application/json''} -Body ''{\"model\":\"C:\\\\Users\\\\nicho\\\\models\\\\qwythos\\\\Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with the single word PONG\"}],\"temperature\":0,\"max_tokens\":12}'' -UseBasicParsing).Content'"
```

Expect a response whose `choices[0].message.content` is `PONG` (NOT empty). If
content is empty: `--reasoning-preserve` is missing.

## Wiring into Hermes

`~/.hermes/config.yaml`:

```yaml
providers:
  ollama:
    api_key: ollama
    base_url: http://192.168.1.163:8910/v1
  yin:
    api_key: ollama
    base_url: http://192.168.1.163:8910/v1

delegation:
  provider: custom:yin
  model: C:\Users\nicho\models\qwythos\Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf
```

The companion skill `qwynthos-hermes-routing` documents the full routing policy.

## Verification

```bash
# API up and model loaded
curl -fsS http://192.168.1.163:8910/v1/models | python3 -m json.tool | head -10
# Real inference
curl -s -X POST http://192.168.1.163:8910/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"C:\\Users\\nicho\\models\\qwythos\\Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf","messages":[{"role":"user","content":"hi"}],"temperature":0,"max_tokens":8}'
# Process state on Yin
ssh -i ~/.ssh/id_ed25519_yin nicho@192.168.1.163 "powershell -NoProfile -Command 'Get-Process llama-server | Format-Table Id, StartTime'"
# Scheduled task health
ssh -i ~/.ssh/id_ed25519_yin nicho@192.168.1.163 "powershell -NoProfile -Command 'Get-ScheduledTaskInfo -TaskName LlamaServerQwythos | Format-List LastRunTime, NumberOfMissedRuns'"
```

## Reference

- llama.cpp: https://github.com/ggml-org/llama.cpp
- Model: Qwythos-9B-Claude-Mythos-5-1M-MTP-Q5_K_M.gguf (Empero AI lineage; see
  GGUF metadata for `n_embd`, `n_ctx_train`, etc.)
- `~/.hermes/skills/qwynthos-hermes-routing` for routing policy
- `~/.hermes/skills/devops/windows-remote-control` for SSH patterns
