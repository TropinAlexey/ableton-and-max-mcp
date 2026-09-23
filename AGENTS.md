# Ableton Live + Max for Live MCP Server — Agent Guide

This file provides context for any AI agent (Claude, GPT, Gemini, Copilot, etc.) working with this codebase.

## What This Project Is

An MCP (Model Context Protocol) server that gives AI agents programmatic control over **Ableton Live** and **Max for Live** via OSC. 40 tools covering transport, tracks, clips, MIDI notes/patterns, devices, and Max for Live.

## Key Architecture

```
AI Agent (MCP Client)
  ↓  MCP Protocol (JSON-RPC 2.0, spec 2026-07-28)
MCP Server (Bun/Node.js, src/index.js)
  ↓  OSC over UDP (ports 11000–11001, localhost only)
Ableton Live + AbletonOSC Remote Script
```

- **Entry point**: `src/index.js` — creates `McpServer`, registers all tools, handles graceful shutdown
- **OSC layer**: `src/osc-client.js` — UDP send/receive, request queue (serialized), health check with TTL cache
- **Tools**: `src/tools/*.js` — each file exports tool configs (Zod v4 schemas) and executor functions
- **Types**: `src/types.js` — JSDoc type definitions
- **ADRs**: `docs/adr/` — architectural decision records

## Tool Modules

| File | Domain | Tools |
|------|--------|-------|
| `transport.js` | Playback, tempo, beat position | 6 |
| `tracks.js` | Track CRUD, volume, pan, mute/solo/arm | 13 |
| `clips.js` | Clip CRUD, fire, stop, duplicate | 7 |
| `notes.js` | MIDI notes, pattern generation (60+ scales, 30+ chord types) | 5 |
| `devices.js` | Device/FX parameters, enable/disable | 5 |
| `max.js` | Max for Live messaging and parameters | 4 |

## Key Design Decisions

- **Request queue**: all OSC request/response calls serialized (AbletonOSC has no request IDs)
- **Health check cache**: 10s TTL, avoids redundant round-trips
- **Validation**: Zod schemas are the single source of truth for input constraints
- **No native modules**: JS OSC codec is <0.1ms, sufficient for all use cases
- **Destructive ops**: honest descriptions, no server-side confirmation (MCP client's responsibility)
- **`max_send_message`**: raw access to Max patches, 1024 char limit, no content filtering
- **Time units**: beats for positions, bars for clip lengths

See `docs/adr/` for full rationale.

## Development

```bash
bun install          # install dependencies
bun start            # run the server
DEBUG=1 bun start    # run with OSC debug logging
npm run test:all     # run tests with mock OSC server (no Ableton needed)
```

## Conventions

- Pure JavaScript (no TypeScript compilation step)
- Each tool module exports a flat object of tool configs; `index.js` iterates and registers them
- OSC addresses follow AbletonOSC conventions: `/live/song/...`, `/live/tracks/...`
- Pattern generation supports 60+ scales, 30+ chord types, custom scale degrees, and random patterns
- All indices are 0-based integers
- MIDI pitch 0-127, velocity 0-127
