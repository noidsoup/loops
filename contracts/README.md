# Contracts

Shared rules that more than one loop must follow. Canonical path: `LOOPS_ROOT/contracts/`.

| File | Purpose |
|---|---|
| [`self-correcting.md`](./self-correcting.md) | Builder → Judge → Manager roles, handoff formats, ground truth, hard stops, stress tests |

Loops that set `self_correcting: true` in `loop.yaml` must **Read** `LOOPS_ROOT/contracts/self-correcting.md` at the start of the produce cycle (or the first Builder phase) and follow it for handoffs and Manager routing.
