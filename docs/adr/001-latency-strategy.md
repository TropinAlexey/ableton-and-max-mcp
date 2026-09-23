# ADR-001: Latency Strategy

**Status:** Accepted  
**Date:** 2026-09-22

## Context

This MCP server is used in live music performance. Latency between an AI agent's command and Ableton's reaction is critical — every millisecond is audible.

The latency chain:

```
AI agent thinks           2,000 - 30,000 ms  (not our control)
MCP JSON-RPC parse                    ~1 ms
Health check                          ~3 ms  (was per-call, now cached)
OSC encode (JS)                     <0.1 ms
UDP send                              ~1 ms
Ableton processing                  2-5 ms   (not our control)
UDP response                          ~1 ms
OSC decode (JS)                     <0.1 ms
```

We control ~5ms of ~35,000ms total. Optimizing the codec saves ~0.05ms — inaudible.

## Decision

1. **Minimize server overhead** — everything between MCP request and UDP packet must be < 1ms
2. **No unnecessary round-trips** — health check cached with 10s TTL; create operations return indices
3. **Reliability over micro-optimization** — JS codec is sufficient; native modules (Rust, C++) only justified if profiling shows a bottleneck
4. **`Buffer.alloc()` over `allocUnsafe()`** — safety over nanoseconds

## Consequences

- Removed dead Rust native module code (see ADR-005)
- Health check cached — saves ~3ms per tool call
- Request queue serializes OSC request/response (see ADR-002) — adds negligible latency, eliminates race conditions
