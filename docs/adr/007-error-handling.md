# ADR-007: Error Handling & Resilience

**Status:** Accepted  
**Date:** 2026-09-22

## Decision

- **OSC timeout:** 5 seconds per request. If Ableton doesn't respond in 5s, something is wrong — report failure immediately rather than waiting longer.
- **Health check:** cached with 10s TTL. Invalidated on failure. Next tool call gets a fresh check.
- **Port conflict (`EADDRINUSE`):** clear error message with diagnostic command (`lsof -i :PORT`).
- **Graceful shutdown:** `SIGINT`/`SIGTERM` handlers close the UDP socket cleanly.
- **No auto-reconnect:** UDP is connectionless. If Ableton restarts, the next health check will detect it. The server doesn't need to "reconnect" — it just needs to detect that Ableton is back.

## Rationale

For live performance, fast failure is better than slow retry. A 5-second timeout is generous enough for complex queries but doesn't block the agent for an unreasonable time.

Auto-reconnect adds complexity for a scenario that's handled naturally: UDP doesn't have connections, and the health check cache invalidates on failure.
