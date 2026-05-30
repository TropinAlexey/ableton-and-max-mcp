# AbletonOSC Remote Script

## Installation

1. Download the AbletonOSC remote script from: https://github.com/Fd2014/AbletonOSC (or similar OSC control surface)

2. Copy the folder to your Ableton User Library:
   - **macOS**: `~/Music/Ableton Library/Remote Scripts/`
   - **Windows**: `C:\Users\[YourUsername]\Music\Ableton\User Library\Remote Scripts\`
   - **Linux**: `~/Music/Ableton/User Library/Remote Scripts/`

3. Restart Ableton Live

4. In Preferences → Link/MIDI → Control Surface → set input/output to AbletonOSC

## Configuration

The MCP server communicates with Ableton via OSC protocol on:
- **Input Port**: 11000 (commands from MCP to Ableton)
- **Output Port**: 11001 (responses from Ableton to MCP)

Make sure these ports are not blocked by your firewall.

## Troubleshooting

If the connection fails:
1. Check that Ableton Live is running
2. Verify AbletonOSC is selected in Preferences
3. Check that ports 11000-11001 are available: `lsof -i :11000` (macOS/Linux)
4. Check MCP server logs for connection errors
