import { equal } from 'node:assert/strict';
import { test } from 'node:test';

import { createGlassSurface } from './glassStyles.ts';

test('createGlassSurface adds web blur to glass surfaces', () => {
  const surface = createGlassSurface('regular', 'web');

  equal(surface.backgroundColor, 'rgba(255,255,255,0.16)');
  equal(surface.borderColor, 'rgba(255,255,255,0.32)');
  equal(surface.backdropFilter, 'blur(22px) saturate(1.35)');
});

test('createGlassSurface keeps native fallback blur-free', () => {
  const surface = createGlassSurface('strong', 'ios');

  equal(surface.backgroundColor, 'rgba(255,255,255,0.24)');
  equal(surface.borderColor, 'rgba(255,255,255,0.42)');
  equal('backdropFilter' in surface, false);
});
