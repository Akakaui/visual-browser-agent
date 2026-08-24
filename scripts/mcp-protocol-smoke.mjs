import { spawn } from 'node:child_process';
import { once } from 'node:events';

const repo = process.env.VBA_REPO || process.cwd();
const child = spawn(process.execPath, ['dist/cli/index.js', 'mcp', '--managed'], {
  cwd: repo,
  stdio: ['pipe', 'pipe', 'pipe']
});
let buffer = '';
const pending = new Map();
let nextId = 1;
child.stdout.setEncoding('utf8');
child.stdout.on('data', data => {
  buffer += data;
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    const jsonStart = line.indexOf('{');
    if (jsonStart < 0) continue;
    const message = JSON.parse(line.slice(jsonStart));
    if (message.id !== undefined) pending.get(message.id)?.(message);
  }
});
child.stderr.setEncoding('utf8');
let stderr = '';
child.stderr.on('data', data => { stderr += data; });
function request(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), 20000);
    pending.set(id, message => { clearTimeout(timeout); pending.delete(id); resolve(message); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function assert(condition, message) { if (!condition) throw new Error(message); }
try {
  const init = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'release-smoke', version: '1.0.0' } });
  assert(init.result?.serverInfo?.name === 'visual-browser-agent', 'initialize did not identify the server');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
  const list = await request('tools/list');
  const names = new Set((list.result?.tools ?? []).map(tool => tool.name));
  for (const name of ['browser_connect', 'navigate', 'capture_screenshot', 'locator_by_role', 'assert', 'request_approval', 'ask_human']) assert(names.has(name), `missing MCP tool: ${name}`);
  const connected = await request('tools/call', { name: 'browser_connect', arguments: { mode: 'managed', headless: true } });
  assert(!connected.result?.isError, 'managed browser connection failed');
  const navigated = await request('tools/call', { name: 'navigate', arguments: { url: 'https://example.com', waitUntil: 'domcontentloaded' } });
  assert(!navigated.result?.isError, 'navigate failed');
  const screenshot = await request('tools/call', { name: 'capture_screenshot', arguments: { action: 'release-smoke', requirement: 'MCP screenshot artifact' } });
  assert(!screenshot.result?.isError, 'capture_screenshot failed');
  const role = await request('tools/call', { name: 'locator_by_role', arguments: { role: 'link', name: 'Learn more' } });
  assert(!role.result?.isError, 'locator_by_role failed');
  const approvalPromise = request('tools/call', { name: 'request_approval', arguments: { runId: 'release-smoke', action: 'send a public message', reason: 'safety gate', details: { site: 'example.com', target: 'test form' } } });
  setTimeout(() => child.stdin.write('no\n'), 100);
  const approval = await approvalPromise;
  assert(!approval.result?.isError && approval.result?.content?.some(item => item.text?.includes('false')), 'approval denial gate failed');
  console.log(JSON.stringify({ passed: true, tools: names.size, initialize: true, browserConnect: true, navigate: true, screenshot: true, locatorByRole: true, approvalGate: true, stderr }, null, 2));
} finally {
  child.kill('SIGKILL');
}
