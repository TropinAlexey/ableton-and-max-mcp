# Ableton Live + Max for Live MCP Server

Full-featured MCP (Model Context Protocol) server for controlling Ableton Live and Max for Live directly from Claude.

## Features

- **Transport Control**: Play, stop, record, set tempo, jump to position
- **Track Management**: Create, delete, rename, mute, solo, arm tracks
- **Clip Control**: Create, fire, stop, duplicate clips
- **MIDI Editing**: Get/set notes, generate patterns (arpeggio, chord, etc.)
- **Device Control**: List devices, set parameters, enable/disable effects
- **Max for Live**: Send messages to Max devices, control M4L parameters
- **Scene Control**: List and fire scenes

## Architecture

```
Claude → MCP Protocol → MCP Server (Node.js) → OSC Protocol → AbletonOSC (Ableton Live)
```

## Quick Start

### 1. Install MCP Server

```bash
cd /Users/mac/Code/ableton-and-max-mcp
npm install
npm run build
```

### 2. Install AbletonOSC Remote Script

Download from: https://github.com/Fd2014/AbletonOSC (or equivalent)

Copy to your Ableton User Library:
- macOS: `~/Music/Ableton Library/Remote Scripts/`
- Windows: `C:\Users\[YourUsername]\Music\Ableton\User Library\Remote Scripts\`
- Linux: `~/Music/Ableton/User Library/Remote Scripts/`

Restart Ableton Live.

### 3. Configure Claude Code

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ableton": {
      "command": "node",
      "args": ["/Users/mac/Code/ableton-and-max-mcp/dist/index.js"]
    }
  }
}
```

### 4. Start Using

Open Claude Code and ask:
- "Play the current project"
- "Create a new MIDI track called 'Drums'"
- "Generate an arpeggio pattern on track 0"

## Available Tools

See [PLAN.md](./PLAN.md) for comprehensive tool documentation.

### Transport
- `transport_get_state` - Get current playback state
- `transport_play` - Start playback
- `transport_stop` - Stop playback
- `transport_record` - Enable recording
- `transport_set_tempo` - Set BPM
- `transport_jump_to` - Jump to bar position

### Tracks
- `tracks_list` - List all tracks
- `tracks_create_midi` - Create MIDI track
- `tracks_create_audio` - Create audio track
- `tracks_set_volume` - Set track volume
- `tracks_set_pan` - Set track pan
- `tracks_mute` / `tracks_unmute` - Mute control
- `tracks_solo` / `tracks_unsolo` - Solo control
- `tracks_arm` / `tracks_disarm` - Record arm

### Clips
- `clips_list` - List clips in track
- `clips_create` - Create new clip
- `clips_fire` - Start playing clip
- `clips_stop` - Stop clip
- `clips_set_name` - Rename clip
- `clips_set_length` - Set clip length

### Notes (MIDI)
- `notes_get` - Get notes from clip
- `notes_set` - Replace all notes
- `notes_add` - Add single note
- `notes_clear` - Clear all notes
- `notes_generate_pattern` - Generate patterns:
  - `arpeggio_up` - Ascending arpeggio
  - `arpeggio_down` - Descending arpeggio
  - `chord` - Chord voicing
  - `groove` - Rhythmic pattern (planned)
  - `random` - Random notes (planned)

### Devices
- `devices_list` - List devices on track
- `devices_get_parameters` - Get device parameters
- `devices_set_parameter` - Set parameter value
- `devices_enable` / `devices_disable` - Enable/disable device

### Max for Live
- `max_list_devices` - List M4L devices
- `max_send_message` - Send message to Max device
- `max_get_parameter` - Get M4L parameter
- `max_set_parameter` - Set M4L parameter

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

### Start server
```bash
npm start
```

## Project Structure

```
src/
├── index.ts              # MCP server entry point
├── osc-client.ts         # OSC communication layer
├── types.ts              # TypeScript definitions
└── tools/
    ├── transport.ts      # Transport controls
    ├── tracks.ts         # Track management
    ├── clips.ts          # Clip control
    ├── notes.ts          # MIDI editing
    ├── devices.ts        # Device/FX control
    └── max.ts            # Max for Live control
```

## Known Limitations

- Some complex operations (track creation with specific channels) require Max for Live device
- Time signature control requires custom M4L device
- Full MIDI editing requires AbletonOSC script enhancements

## Troubleshooting

### "Ableton Live is not connected"
- Check Ableton is running
- Verify AbletonOSC remote script is enabled
- Check ports 11000-11001 are not blocked

### OSC timeout
- Increase request timeout in `osc-client.ts` if on slow network
- Verify Ableton is responding to commands

### Type errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version: `npm ls typescript`

## Performance Tips

- Use pattern generation for complex MIDI rather than individual note additions
- Batch device changes when possible
- Close unused clips before recording

## Contributing

This is a living project. Areas for expansion:
- Performance optimization
- Additional pattern generators (groove, random)
- Full clip duplication with MIDI data
- Better device discovery and parameter mapping
- Test suite

## License

MIT

## See Also

- [Ableton Live Object Model](https://github.com/gluon/AbletonOSC)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
- [Max for Live Documentation](https://help.ableton.com/article_attachments/360000994879/Max_for_Live_User_Guide.pdf)
