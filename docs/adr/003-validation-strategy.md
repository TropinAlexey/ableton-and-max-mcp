# ADR-003: Validation Strategy

**Status:** Accepted  
**Date:** 2026-09-22

## Context

Input validation was inconsistent: some parameters had runtime checks in executors (BPM 20-300, volume 0-1), others had none (pitch, velocity, indices). Zod schemas were bare `z.number()` without constraints.

## Decision

Single source of truth: Zod schemas with constraints (`.min()`, `.max()`, `.int()`). No manual validation in executors.

Benefits:
- MCP clients see valid ranges in tool schemas — agents make fewer mistakes
- Runtime validation happens before executor code runs
- One place to update constraints

Specific constraints:
- MIDI pitch: `0-127` (int)
- Velocity: `0-127` (int)
- All indices: `>= 0` (int)
- Volume: `0.0-1.0`
- Pan: `-1.0 to 1.0`
- Device parameter value: `0.0-1.0`
- BPM: any positive number (no artificial limits — Ableton decides)
- Durations/lengths: positive numbers
- Max message: max 1024 characters

## Consequences

- Removed all manual validation from executor `switch` cases
- Tool descriptions duplicate key constraints for agents that don't inspect schemas
