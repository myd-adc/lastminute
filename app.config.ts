import type { ConfigContext, ExpoConfig } from 'expo/config';

// Web is served from the domain root. Set EXPO_BASE_URL only to host the build under a sub-path.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});
