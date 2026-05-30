/**
 * Тест Clips + Notes tools
 */
import { MockOSCServer } from './mock-osc-server.js';
import { AbletonOSCClient } from './osc-client.js';
import { executeClipsTool } from './tools/clips.js';
import { executeNotesTool } from './tools/notes.js';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests(): Promise<void> {
  console.error('\n╔═══════════════════════════════════════════════════════════════╗');
  console.error('║        ABLETON-MCP CLIPS + NOTES TEST (MOCK OSC)           ║');
  console.error('╚═══════════════════════════════════════════════════════════════╝\n');

  const mockServer = new MockOSCServer(11001);
  await mockServer.start();
  await sleep(200);

  const osc = new AbletonOSCClient(11000, 11001);
  await osc.connect();
  await sleep(100);

  try {
    console.error('━━━━━ TEST 1: Clips Create ━━━━━');
    const createResult = await executeClipsTool(osc, 'clips_create', {
      trackIndex: 0,
      sceneIndex: 0,
      length: 4,
    });
    console.error('Result:', JSON.stringify(createResult, null, 2));

    await sleep(50);

    console.error('\n━━━━━ TEST 2: Notes Generate Arpeggio ━━━━━');
    const arpeggioResult = await executeNotesTool(osc, 'notes_generate_pattern', {
      trackIndex: 0,
      sceneIndex: 0,
      pattern: 'arpeggio_up',
      root: 60,
      scale: 'major',
      length: 2,
    });
    console.error('Generated notes:', (arpeggioResult as any).notes?.length || 0);

    await sleep(50);

    console.error('\n━━━━━ TEST 3: Notes Generate Chord ━━━━━');
    const chordResult = await executeNotesTool(osc, 'notes_generate_pattern', {
      trackIndex: 1,
      sceneIndex: 0,
      pattern: 'chord',
      root: 64,
      scale: 'minor',
      length: 1,
    });
    console.error('Generated chord notes:', (chordResult as any).notes?.length || 0);

    await sleep(50);

    console.error('\n━━━━━ TEST 4: Clips Set Name ━━━━━');
    const nameResult = await executeClipsTool(osc, 'clips_set_name', {
      trackIndex: 0,
      sceneIndex: 0,
      name: 'Intro',
    });
    console.error('Result:', JSON.stringify(nameResult, null, 2));

    console.error('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.error('║               ✅ CLIPS + NOTES TESTS PASSED                 ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
  } finally {
    osc.disconnect();
    mockServer.stop();
  }
}

runTests().catch(console.error);
