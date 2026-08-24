import { describe, expect, it } from 'vitest';
import { getChromePath, getDebugPort, listProfiles } from './profiles.js';

describe('browser profile discovery', () => {
  it('returns a valid Chrome executable path or null without throwing', () => {
    const path = getChromePath();
    expect(path === null || typeof path === 'string').toBe(true);
  });

  it('returns profile records with stable required fields', async () => {
    const profiles = await listProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    for (const profile of profiles) {
      expect(profile.name).toEqual(expect.any(String));
      expect(profile.directory).toEqual(expect.any(String));
      expect(typeof profile.isDefault).toBe('boolean');
    }
  });

  it('reports either an available debug port or null', async () => {
    const port = await getDebugPort();
    expect(port === null || [9222, 9223, 9224, 9225].includes(port)).toBe(true);
  });
});
