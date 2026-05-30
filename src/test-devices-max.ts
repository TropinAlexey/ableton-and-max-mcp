/**
 * Тест Devices + Max for Live tools
 */
import { MockOSCServer } from './mock-osc-server.js';
import { AbletonOSCClient } from './osc-client.js';
import { executeDevicesTool } from './tools/devices.js';
import { executeMaxTool } from './tools/max.js';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests(): Promise<void> {
  console.error('\n╔═══════════════════════════════════════════════════════════════╗');
  console.error('║        ABLETON-MCP DEVICES + MAX TEST (MOCK OSC)           ║');
  console.error('╚═══════════════════════════════════════════════════════════════╝\n');

  const mockServer = new MockOSCServer(11001);
  await mockServer.start();
  await sleep(200);

  const osc = new AbletonOSCClient(11000, 11001);
  await osc.connect();
  await sleep(100);

  try {
    console.error('━━━━━ TEST 1: Devices Set Parameter ━━━━━');
    const paramResult = await executeDevicesTool(osc, 'devices_set_parameter', {
      trackIndex: 0,
      deviceIndex: 0,
      parameterName: 'Dry_Wet',
      value: 0.75,
    });
    console.error('Result:', JSON.stringify(paramResult, null, 2));

    await sleep(50);

    console.error('\n━━━━━ TEST 2: Devices Enable ━━━━━');
    const enableResult = await executeDevicesTool(osc, 'devices_enable', {
      trackIndex: 0,
      deviceIndex: 0,
    });
    console.error('Result:', JSON.stringify(enableResult, null, 2));

    await sleep(50);

    console.error('\n━━━━━ TEST 3: Devices Disable ━━━━━');
    const disableResult = await executeDevicesTool(osc, 'devices_disable', {
      trackIndex: 0,
      deviceIndex: 0,
    });
    console.error('Result:', JSON.stringify(disableResult, null, 2));

    await sleep(50);

    console.error('\n━━━━━ TEST 4: Max Set Parameter ━━━━━');
    const maxSetResult = await executeMaxTool(osc, 'max_set_parameter', {
      trackIndex: 1,
      deviceIndex: 0,
      parameterName: 'rate',
      value: 0.5,
    });
    console.error('Result:', JSON.stringify(maxSetResult, null, 2));

    await sleep(50);

    console.error('\n━━━━━ TEST 5: Max Send Message ━━━━━');
    const msgResult = await executeMaxTool(osc, 'max_send_message', {
      trackIndex: 1,
      deviceIndex: 0,
      message: 'trigger 1',
    });
    console.error('Result:', JSON.stringify(msgResult, null, 2));

    console.error('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.error('║             ✅ DEVICES + MAX TESTS PASSED                  ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
  } finally {
    osc.disconnect();
    mockServer.stop();
  }
}

runTests().catch(console.error);
