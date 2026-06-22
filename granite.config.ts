import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'hoo',
  brand: {
    displayName: '후우',
    primaryColor: '#8EC7D5',
    icon: 'https://static.toss.im/appsintoss/46899/56b1bd34-0e94-44aa-a8c3-3c99dc2ac38c.png',
  },
  web: {
    host: 'localhost',
    port: 8081,
    commands: {
      dev: 'npm run web -- --port 8081',
      build: 'npm run build:web',
    },
  },
  webViewProps: {
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
    bounces: false,
    overScrollMode: 'never',
  },
  permissions: [
    {
      name: 'microphone',
      access: 'access',
    },
  ],
  outdir: 'dist',
});
