import { equal } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';

async function readAppSource() {
  return readFile(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
}

test('hoo microphone metering does not read or upload recorded audio files', async () => {
  const appSource = await readAppSource();

  equal(appSource.includes('Audio.RecordingOptionsPresets.LOW_QUALITY'), true);
  equal(appSource.includes('recording.getURI'), false);
  equal(appSource.includes('createNewLoadedSoundAsync'), false);
  equal(appSource.includes('new FormData'), false);
});
