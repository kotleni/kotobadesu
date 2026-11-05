import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage'],
    web_accessible_resources: [
      {
        resources: ['dict/*'],
        matches: [
          '*://*.youtube.com/*',
          'moz-extension://*',
          'chrome-extension://*'
        ],
      },
    ],
  },
});
