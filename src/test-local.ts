/**
 * Локальный тест MCP tools с Mock OSC сервером
 * Позволяет тестировать без Ableton Live
 *
 * Запуск: DEBUG=true npx tsx src/test-local.ts
 */

import { MockOSCServer } from './mock-osc-server.js';
import { AbletonOSCClient } from './osc-client.js';
import { executeTransportTool } from './tools/transport.js';
import { executeTracksTool } from './tools/tracks.js';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests(): Promise<void> {
  console.error('\n╔═══════════════════════════════════════════════════════════════╗');
  console.error('║          ABLETON-MCP LOCAL TEST WITH MOCK OSC SERVER         ║');
  console.error('╚═══════════════════════════════════════════════════════════════╝\n');

  // Start mock server
  const mockServer = new MockOSCServer(11001);
  await mockServer.start();

  // Give it a moment to start listening
  await sleep(200);

  // Create OSC client
  const osc = new AbletonOSCClient(11000, 11001);
  await osc.connect();

  await sleep(100);

  try {
    console.error('\n━━━━━ TEST 1: Health Check ━━━━━');
    const healthy = await osc.healthCheck();
    console.error(`✅ Health check: ${healthy ? 'OK' : 'FAILED'}\n`);

    if (!healthy) {
      console.error('❌ Cannot connect to mock server');
      return;
    }

    console.error('━━━━━ TEST 2: Transport Get State ━━━━━');
    const state = await executeTransportTool(osc, 'transport_get_state', {});
    console.error('Result:', JSON.stringify(state, null, 2));

    console.error('\n━━━━━ TEST 3: Transport Play ━━━━━');
    const playResult = await executeTransportTool(osc, 'transport_play', {});
    console.error('Result:', JSON.stringify(playResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 4: Transport Set Tempo ━━━━━');
    const tempoResult = await executeTransportTool(osc, 'transport_set_tempo', { bpm: 140 });
    console.error('Result:', JSON.stringify(tempoResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 5: Transport Stop ━━━━━');
    const stopResult = await executeTransportTool(osc, 'transport_stop', {});
    console.error('Result:', JSON.stringify(stopResult, null, 2));

    console.error('\n━━━━━ TEST 6: Track Set Volume ━━━━━');
    const volumeResult = await executeTracksTool(osc, 'tracks_set_volume', { index: 0, volume: 0.75 });
    console.error('Result:', JSON.stringify(volumeResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 7: Track Set Pan ━━━━━');
    const panResult = await executeTracksTool(osc, 'tracks_set_pan', { index: 1, pan: 0.5 });
    console.error('Result:', JSON.stringify(panResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 8: Track Mute ━━━━━');
    const muteResult = await executeTracksTool(osc, 'tracks_mute', { index: 0 });
    console.error('Result:', JSON.stringify(muteResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 9: Track Set Name ━━━━━');
    const nameResult = await executeTracksTool(osc, 'tracks_set_name', { index: 0, name: 'Drums' });
    console.error('Result:', JSON.stringify(nameResult, null, 2));

    await sleep(100);

    console.error('\n━━━━━ TEST 10: Track Solo ━━━━━');
    const soloResult = await executeTracksTool(osc, 'tracks_solo', { index: 1 });
    console.error('Result:', JSON.stringify(soloResult, null, 2));

    console.error('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.error('║                     ✅ ALL TESTS PASSED                       ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝\n');

    // Print final state
    console.error('Final Mock State:');
    console.error(JSON.stringify(mockServer.getState(), null, 2));
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
    console.error(error);
  } finally {
    osc.disconnect();
    mockServer.stop();
  }
}

// Run tests
runTests().catch(console.error);
