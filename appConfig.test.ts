import { deepEqual, equal } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';

type ExpoAppConfig = {
  expo?: {
    name?: string;
    slug?: string;
    ios?: {
      infoPlist?: {
        NSMicrophoneUsageDescription?: string;
      };
      usesAppleSignIn?: boolean;
    };
    scheme?: string;
  };
};

async function readAppConfig() {
  return JSON.parse(await readFile(fileURLToPath(new URL('./app.json', import.meta.url)), 'utf8')) as ExpoAppConfig;
}

test('app config prepares the production auth redirect scheme', async () => {
  const config = await readAppConfig();

  equal(config.expo?.name, 'HOO');
  equal(config.expo?.slug, 'hoo');
  equal(config.expo?.scheme, 'hoo');
});

test('app config enables Sign in with Apple capability sync', async () => {
  const config = await readAppConfig();

  deepEqual(config.expo?.ios?.usesAppleSignIn, true);
});

test('app config explains local-only microphone metering for review', async () => {
  const config = await readAppConfig();
  const description = config.expo?.ios?.infoPlist?.NSMicrophoneUsageDescription ?? '';

  equal(description.includes('마이크 볼륨만 기기 안에서 실시간으로 사용'), true);
  equal(description.includes('서버로 전송하지 않습니다'), true);
});
