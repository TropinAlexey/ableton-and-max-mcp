# ADR-009: API Naming & Tool Descriptions

**Status:** Accepted  
**Date:** 2026-09-22

## Decision

### Naming
- All indices: `snake_case`, 0-based: `track_index`, `clip_index`, `device_index`
- Time positions: `beat` (universal, works in any time signature)
- Lengths: `length` in bars (for clips), `duration` in beats (for notes)
- Tool names: `module_action` pattern (`tracks_create_midi`, `notes_generate_pattern`)

### Descriptions
- English language
- Descriptions are the primary documentation for AI agents
- Destructive operations explicitly marked: "Cannot be undone", "Existing data is lost"
- Parameter ranges stated in description even when enforced by Zod (not all clients inspect schemas)
- Descriptions include usage hints: "Use tracks_list to verify the index first", "Use devices_get_parameters first to see available parameter names"

### Tool descriptions as API contract
Descriptions guide the agent's behavior. They should be:
1. **Honest** — state exactly what happens, including side effects
2. **Actionable** — tell the agent what to do before calling (list first, check parameters first)
3. **Concise** — one or two sentences, no marketing language

## Consequences

- `transport_jump_to` parameter renamed from `bar` to `beat`
- All descriptions rewritten for consistency and honesty
