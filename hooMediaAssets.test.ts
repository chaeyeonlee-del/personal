import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

test('hoo session background video is cropped and web safe for silent playback', () => {
  const videoPath = join(import.meta.dirname, 'assets', '5.ui element', 'hoo-session-bg-video.mp4');
  const metadata = JSON.parse(execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_streams',
    '-of',
    'json',
    videoPath,
  ], { encoding: 'utf8' }));
  const videoStreams = metadata.streams.filter((stream: { codec_type: string }) => stream.codec_type === 'video');
  const audioStreams = metadata.streams.filter((stream: { codec_type: string }) => stream.codec_type === 'audio');
  const [videoStream] = videoStreams;

  equal(videoStreams.length, 1);
  equal(audioStreams.length, 0);
  equal(videoStream.codec_name, 'h264');
  equal(videoStream.pix_fmt, 'yuv420p');
  equal(videoStream.width, 976);
  equal(videoStream.height, 1240);
});

test('hoo bubble audio keeps the multi-bubble texture but is mastered loudly enough to hear', () => {
  const audioPath = join(import.meta.dirname, 'assets', '4.sound effect', 'hoo-hydrophone-bubbles.mp3');
  const metadata = JSON.parse(execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    audioPath,
  ], { encoding: 'utf8' }));
  const volumeOutput = execFileSync('bash', [
    '-lc',
    `ffmpeg -hide_banner -i "${audioPath}" -af volumedetect -f null - 2>&1`,
  ], { encoding: 'utf8' });
  const meanVolumeMatch = volumeOutput.match(/mean_volume: (-?\d+(?:\.\d+)?) dB/);

  ok(Number(metadata.format.duration) > 5.5);
  ok(meanVolumeMatch);
  ok(Number(meanVolumeMatch[1]) > -20);
});
