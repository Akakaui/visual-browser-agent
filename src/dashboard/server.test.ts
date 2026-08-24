import { describe, expect, it } from 'vitest';
import { startDashboard } from './server.js';

describe('local dashboard integration', () => {
  it('serves a local-only control panel', async () => {
    const port = 8791;
    await startDashboard(port);
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();
    expect(response.ok).toBe(true);
    expect(html).toContain('Visual Browser Agent');
  }, 15000);
});
