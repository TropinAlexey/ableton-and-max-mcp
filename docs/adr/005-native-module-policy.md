# ADR-005: Native Module Policy

**Status:** Accepted  
**Date:** 2026-09-22

## Context

The codebase contained dead code attempting to load a Rust native module (`native/target/release/osc_native.node`) for OSC parsing/writing. The `native/` directory didn't exist, producing a warning on every startup.

## Decision

Remove all native module code. JS-only OSC codec.

### Rationale

The JS codec is already sub-millisecond (<0.1ms per encode/decode). A native module would save ~0.05ms — inaudible in any context.

Cost of a native module:
- Rust toolchain as build dependency
- Platform-specific binaries (macOS/Linux/Windows × arm64/x64)
- CI/CD complexity (cross-compilation, binary distribution)
- Contributor barrier (must install Rust to build)

### When to revisit

Only if profiling shows the JS codec as a bottleneck — e.g., sustained >1000 messages/sec with observable latency degradation.

## Consequences

- Removed: `osc_native` import, `if (osc_native)` branches, fallback logic
- `Buffer.allocUnsafe()` replaced with `Buffer.alloc()` (safety over nanoseconds)
- Fixed-size buffer (4096) replaced with dynamic size calculation (prevents overflow on large messages)
- Startup no longer prints confusing "Native module not loaded" warning
