# Ableton Live + Max for Live MCP Server

> **Production-grade, zero-latency** MCP (Model Context Protocol) server for controlling Ableton Live and Max for Live from any AI agent.
>
> **v2.1** — security hardening, 60+ scales, 30+ chord types, request queue, agent-agnostic.

[![GitHub](https://img.shields.io/badge/GitHub-TropinAlexey%2Fableton--and--max--mcp-blue)](https://github.com/TropinAlexey/ableton-and-max-mcp)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-2026--07--28-purple)](https://modelcontextprotocol.io)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f9f1e1)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node.js-18%2B-339933)](https://nodejs.org)
[![Tools](https://img.shields.io/badge/MCP_Tools-40-orange)](https://github.com/TropinAlexey/ableton-and-max-mcp)

## Overview

This project gives any MCP-compatible AI agent complete programmatic control over Ableton Live and Max for Live through the Model Context Protocol (MCP). Generate music patterns, manage tracks, edit MIDI, control synthesizers, and interact with Max patches — all directly from AI conversations.

**Why this matters:**
- **No GUI clicking** — describe what you want, the AI agent does it
- **Reproducible workflows** — save and version your music configurations
- **Real-time collaboration** — your AI assistant can analyze and modify your project live
- **Pattern generation** — 60+ scales, 30+ chord types, custom voicings, random patterns

## Performance

| Metric | Value |
|--------|-------|
| **Startup Time** | ~50ms (Bun) |
| **Server Overhead** | <1ms per tool call |
| **OSC Latency** | 1-2ms per command |
| **Memory Usage** | <20MB |
| **Source** | ~1,200 lines JavaScript |

## Quick Start

### Prerequisites

```bash
# Install Bun (recommended) or use Node.js 18+
curl -fsSL https://bun.sh/install | bash

# Ableton Live 11+ with AbletonOSC Remote Script
# Download: https://github.com/Fd2014/AbletonOSC
```

### Installation

```bash
git clone https://github.com/TropinAlexey/ableton-and-max-mcp.git
cd ableton-and-max-mcp
bun install
bun start
```

### Configure Your MCP Client

Add the server to your MCP client configuration. Example for a JSON-based config:

```json
{
  "mcpServers": {
    "ableton": {
      "command": "bun",
      "args": ["run", "/path/to/ableton-and-max-mcp/src/index.js"]
    }
  }
}
```

Common config locations:
- **Claude Code / Claude Desktop**: `~/.config/Claude/claude_desktop_config.json`
- **Cursor**: `.cursor/mcp.json` in your project
- **VS Code (Copilot)**: `.vscode/mcp.json` in your project
- **Windsurf**: `~/.codeium/windsurf/mcp_config.json`

Restart your MCP client — 40 tools available!

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AI Agent (MCP Client)                  │
│            Any LLM with MCP support                      │
└─────────────────────────────────────────────────────────┘
                           ↓
                    MCP Protocol 2026-07-28 (JSON-RPC 2.0)
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Ableton MCP Server (Bun/Node.js)                │
│  - Tool Registration  (40 MCP tools)                     │
│  - Request Queue      (serialized, race-free)            │
│  - Health Check Cache (10s TTL)                          │
│  - OSC Client Layer   (localhost-only UDP)                │
└─────────────────────────────────────────────────────────┘
                           ↓
                  OSC Protocol (UDP, 127.0.0.1)
                   Port 11000 (in) / 11001 (out)
                           ↓
┌─────────────────────────────────────────────────────────┐
│         Ableton Live + Max for Live                      │
│  - AbletonOSC Remote Script (MIDI Control Surface)       │
│  - Live Object Model (LOM) Access                        │
│  - Max for Live Integration                              │
└─────────────────────────────────────────────────────────┘
```

## Available Tools (40 Total)

### Transport Control (6 tools)

| Tool | Description |
|------|-------------|
| `transport_get_state` | Get playback state, tempo, position (in beats) |
| `transport_play` | Start playback |
| `transport_stop` | Stop playback |
| `transport_record` | Enable recording |
| `transport_set_tempo` | Set BPM (any positive value) |
| `transport_jump_to` | Jump to beat position (works in any time signature) |

### Track Management (13 tools)

| Tool | Description |
|------|-------------|
| `tracks_list` | List all tracks with names, volumes, pans, and states |
| `tracks_create_midi` | Create new MIDI track |
| `tracks_create_audio` | Create new audio track |
| `tracks_delete` | Permanently delete track (cannot be undone) |
| `tracks_rename` | Rename track |
| `tracks_set_volume` | Set volume (0.0–1.0) |
| `tracks_set_pan` | Set pan (-1.0 to 1.0) |
| `tracks_mute` | Mute track |
| `tracks_unmute` | Unmute track |
| `tracks_solo` | Solo track (mutes all others) |
| `tracks_unsolo` | Remove solo |
| `tracks_arm` | Arm for recording |
| `tracks_disarm` | Disarm recording |

### Clip Control (7 tools)

| Tool | Description |
|------|-------------|
| `clips_list` | List all clips in a track |
| `clips_create` | Create new empty MIDI clip |
| `clips_fire` | Start playing a clip |
| `clips_stop` | Stop a playing clip |
| `clips_duplicate` | Duplicate clip to next slot |
| `clips_set_name` | Rename clip |
| `clips_set_length` | Set clip length in bars |

### MIDI Notes + Pattern Generation (5 tools)

| Tool | Description |
|------|-------------|
| `notes_get` | Get all MIDI notes from a clip |
| `notes_set` | Replace ALL notes in a clip (destructive) |
| `notes_add` | Add a single note without removing existing ones |
| `notes_clear` | Remove ALL notes from a clip (destructive) |
| `notes_generate_pattern` | Generate patterns with 60+ scales and 30+ chord types |

**Patterns:** `arpeggio_up`, `arpeggio_down`, `chord`, `random`

**Scales (60+):** All 7 modes (ionian–locrian), harmonic/melodic minor, pentatonic, blues, chromatic, whole tone, diminished, augmented, Hungarian, gypsy, phrygian dominant, double harmonic, flamenco, enigmatic, Neapolitan, Persian, Arabic, Japanese (hirajoshi, in-sen, iwato, kumoi, yo), Indian (bhairav, purvi, marwa, todi), bebop, lydian variants, and more.

**Chord types (30+):** power, major/minor/dim/aug triads, sus2/sus4, all seventh chords, sixths, ninths (incl. b9, #9, add9, 6/9), elevenths, thirteenths, dom7#11.

**Custom voicings:** pass `degrees: [1, 3, 5, 7]` to build any chord from scale degrees.

**Example:**
```
notes_generate_pattern(
  track_index: 0,
  clip_index: 0,
  pattern: "chord",
  root_note: 60,          // C4
  scale: "minor",
  chord_type: "minor7",
  length: 2               // 2 bars
)
```

### Device/FX Control (5 tools)

| Tool | Description |
|------|-------------|
| `devices_list` | List all devices on a track |
| `devices_get_parameters` | Get device parameters with current values |
| `devices_set_parameter` | Set parameter value (0.0–1.0, normalized) |
| `devices_enable` | Turn on device (bypass off) |
| `devices_disable` | Turn off device (bypass on) |

### Max for Live (4 tools)

| Tool | Description |
|------|-------------|
| `max_list_devices` | List all M4L devices on a track |
| `max_send_message` | Send raw message to Max patch (1024 char limit) |
| `max_get_parameter` | Get M4L parameter value |
| `max_set_parameter` | Set M4L parameter value |

## Usage Examples

### In AI Conversations

```
User: "Create a new MIDI track called 'Bass'"
→ Agent uses: tracks_create_midi

User: "Generate a dorian arpeggio over 4 bars"
→ Agent uses: notes_generate_pattern (arpeggio_up, dorian, 4 bars)

User: "Set the tempo to 140 BPM and play"
→ Agent uses: transport_set_tempo, transport_play

User: "Build a Cm7 chord and sustain for 2 bars"
→ Agent uses: notes_generate_pattern (chord, minor, chord_type: minor7, 2 bars)

User: "Create a chord progression with Em, Am, C, G"
→ Agent uses: clips_create + notes_generate_pattern (chord) × 4
```

### Via Command Line

```bash
# Run the server
bun start

# Run with OSC debug logging
DEBUG=1 bun start

# Watch mode (auto-reload on changes)
bun run --watch src/index.js

# Or use Node.js
node src/index.js
```

## Project Structure

```
src/
├── index.js           # MCP server entry + graceful shutdown (95 lines)
├── osc-client.js      # OSC protocol, request queue, health cache (273 lines)
├── types.js           # JSDoc type definitions
└── tools/
    ├── transport.js   # Transport control (66 lines)
    ├── tracks.js      # Track management (144 lines)
    ├── clips.js       # Clip operations (103 lines)
    ├── notes.js       # MIDI + 60 scales + 30 chords + patterns (335 lines)
    ├── devices.js     # Device/FX control (70 lines)
    └── max.js         # Max for Live integration (70 lines)

docs/adr/               # 9 architectural decision records

Total: ~1,200 lines of production JavaScript
```

## Security

- **Localhost only** — UDP socket bound to `127.0.0.1`, not accessible from the network
- **Input validation** — Zod schemas enforce types, ranges, and limits on all inputs
- **Message limits** — `max_send_message` capped at 1024 characters
- **Parameter limits** — parameter names capped at 256 characters
- **Honest descriptions** — destructive tools clearly marked ("Cannot be undone", "Existing notes are lost")
- **No auth needed** — server runs locally, MCP handles the agent connection

See [ADR-004: Security Model](docs/adr/004-security-model.md) for full rationale.

## Troubleshooting

### "Ableton not connected"

```bash
# Check ports are available
lsof -i :11000
lsof -i :11001

# Run with debug logging
DEBUG=1 bun start

# Verify AbletonOSC is installed:
~/Music/Ableton\ Library/Remote\ Scripts/AbletonOSC/
```

**Solutions:**
- Check Ableton Live is running
- Verify AbletonOSC Remote Script is enabled in Preferences
- Check ports 11000-11001 aren't blocked by firewall
- Restart Ableton if script doesn't load

### "Port 11000 already in use"

Another instance is running. Check with `lsof -i :11000` and stop it.

### High Latency

Most latency (2-5ms) comes from Ableton/hardware, not software:
- Server overhead: <1ms (health check cached, request queue serialized)
- OSC codec: <0.1ms
- Network stack: ~1ms
- Ableton processing: 2-5ms (hardware-bound)

## Changelog

### v2.1.0

Security hardening, pattern generation overhaul, agent-agnostic rewrite.

**What changed:**
- **Security**: UDP bound to 127.0.0.1 (was 0.0.0.0), message/parameter length limits
- **OSC client**: request queue (serialized), health check cache (10s TTL, bypasses queue), dynamic buffer sizing, `flattenArgs` for array/object support, graceful shutdown
- **Pattern generation**: 60+ scales, 30+ chord types, custom degrees, random pattern, scale-aware chords
- **Validation**: Zod schemas as single source of truth, BPM without limits
- **API**: `transport_jump_to` uses beats (not bars), honest descriptions for destructive ops
- **Docs**: AGENTS.md for any AI agent, README agent-agnostic, 9 ADRs
- **Cleanup**: removed dead Rust native module, TypeScript sources, dist/node_modules from git

### v2.0.0

Upgraded to **MCP SDK v2** (`@modelcontextprotocol/server@2.0.0`) aligned with MCP specification `2026-07-28`.

**Breaking changes:**
- Requires Node.js 18+ or Bun 1.0+
- Dependency changed: `@modelcontextprotocol/sdk` → `@modelcontextprotocol/server` + `zod@4`

**What changed:**
- **Stateless protocol** — no more `initialize`/`notifications/initialized` handshake
- **`McpServer` + `registerTool` API** — declarative per-tool registration
- **Zod v4 schemas** — Standard Schema instead of raw JSON Schema
- **Cleaner architecture** — each tool module exports config + executor

### v1.0.0

Initial release with 42 MCP tools for Ableton Live + Max for Live control.

## Limitations & Future Work

### Current Limitations
- Time signature control (requires M4L device)
- Full clip duplication with MIDI data preservation
- Device discovery across all plugin types

### Planned Features
- Real-time state streaming (WebSocket)
- Additional pattern generators (groove, probabilistic)
- Multi-device synchronization
- Snapshot save/load system

## Installation of AbletonOSC

1. Download: https://github.com/Fd2014/AbletonOSC/releases
2. Extract to: `~/Music/Ableton Library/Remote Scripts/`
3. Restart Ableton Live
4. In Preferences → Link/Tempo/MIDI → Control Surface → select **AbletonOSC**

## Compatible MCP Clients

This server works with any MCP-compatible client, including:
- [Claude Code](https://github.com/anthropics/claude-code) / [Claude Desktop](https://claude.ai)
- [Cursor](https://cursor.com)
- [VS Code with GitHub Copilot](https://code.visualstudio.com)
- [Windsurf](https://codeium.com/windsurf)
- Any other client implementing the [MCP specification](https://modelcontextprotocol.io)

## Contributing

Contributions welcome! Areas for improvement:
- Additional pattern generators
- Performance benchmarks
- Integration tests
- New scales and chord types

## License

MIT © Alexey Tropin

## Links

- **GitHub**: https://github.com/TropinAlexey/ableton-and-max-mcp
- **MCP Specification**: https://modelcontextprotocol.io/specification/2026-07-28
- **AbletonOSC**: https://github.com/Fd2014/AbletonOSC
- **Max for Live**: https://www.ableton.com/en/live/max-for-live/

## Support

For issues, feature requests, or questions:
1. Check troubleshooting section
2. Enable DEBUG logging: `DEBUG=1 bun start`
3. Open an issue with logs and reproduction steps

---

**Made for musicians and AI enthusiasts**
