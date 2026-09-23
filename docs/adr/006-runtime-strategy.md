# ADR-006: Runtime Strategy

**Status:** Accepted  
**Date:** 2026-09-22

## Decision

- **Primary runtime:** Bun (fast startup ~50ms, native ESM support)
- **Compatibility:** Node.js 18+ (no Bun-specific APIs used)
- **No Bun-only dependencies** in `package.json`

## Rationale

Bun is faster for startup and I/O, but Node.js has wider adoption. Keeping compatibility costs nothing — the codebase uses only standard Node.js APIs (`dgram`, `events`, `Buffer`, ESM imports).

Users can run with either:
```bash
bun start        # preferred
npm start         # also works
node src/index.js # direct
```
