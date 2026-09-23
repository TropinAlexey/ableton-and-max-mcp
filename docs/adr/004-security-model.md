# ADR-004: Security Model

**Status:** Accepted  
**Date:** 2026-09-22

## Context

The server runs on localhost, communicates via UDP to Ableton on 127.0.0.1. Remote attacks are not possible. The primary threat vector is prompt injection through the AI agent.

`max_send_message` sends arbitrary strings to Max for Live patches, which can interpret them as commands (e.g., `script delete`, `read`, `patcher`).

## Decision

- **No authentication** — MCP protocol doesn't support it; server is local-only
- **`max_send_message`**: message length capped at 1024 characters; no allowlist/blocklist (Max patches are too diverse for static filtering; a blocklist gives false security)
- **Destructive tools** (`tracks_delete`, `notes_clear`, `notes_set`): honest descriptions ("Cannot be undone", "Existing notes are lost"); no server-side confirmation (MCP doesn't support interactive dialogs; confirmation is the MCP client's responsibility)
- **Zod validation** on all inputs prevents malformed data from reaching Ableton

## Alternatives Rejected

- **Blocklist for Max messages**: too easy to bypass via `[forward]`, `[send]` inside patches; gives false sense of security
- **Allowlist for Max messages**: kills the tool's universality; every user's patches are different
- **Server-side confirmation**: MCP protocol has no mechanism for server-initiated prompts to the user

## Consequences

- Tool descriptions are the primary security mechanism — they inform the AI agent about risks
- The agent and MCP client are responsible for confirming destructive operations with the user
