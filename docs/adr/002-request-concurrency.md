# ADR-002: Request Concurrency Model

**Status:** Accepted  
**Date:** 2026-09-22

## Context

AbletonOSC does not support request IDs. Responses are matched by OSC address. If two requests share the same address (e.g., two `tracks_list` calls), the second overwrites the first's callback — the first hangs until timeout.

Many tools use the same base address `/live/tracks` with different arguments, making parallel requests inherently unsafe.

## Options Considered

1. **Composite key matching** (`address + args`) — doesn't solve identical-args case; unreliable because AbletonOSC response may not echo args
2. **Request ID** — AbletonOSC doesn't support echo IDs; we don't control the protocol
3. **Request queue** — serialize all request/response operations

## Decision

Option 3: serialize all `request()` calls through a FIFO queue. Fire-and-forget `send()` calls bypass the queue.

## Consequences

- Zero race conditions on OSC request/response matching
- Sequential `request()` calls add ~3ms each instead of running in parallel
- At 1-2ms OSC latency, the overhead is inaudible even in live performance
- `transport_get_state` (3 sequential requests) takes ~9ms instead of ~3ms — acceptable
