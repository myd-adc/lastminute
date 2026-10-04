import type { ConfigContext, ExpoConfig } from 'expo/config';

// GitHub Pages serves the web build under /<repo>; CI sets EXPO_BASE_URL, local dev stays at /.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});
