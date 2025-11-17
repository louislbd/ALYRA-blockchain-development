import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Custom webpack to avoid bundling server/test-only packages into client builds
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      const aliasesToDisable = [
        'pino',
        'pino/lib/transport',
        'thread-stream',
        'desm',
        'tap',
        'tape',
        'fastbench',
        'sonic-boom',
        'why-is-node-running',
        'pino-elasticsearch',
      ];

      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};

      for (const name of aliasesToDisable) {
        // Mark these modules as false so bundlers skip them for client
        config.resolve.alias[name] = false;
      }

      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
        child_process: false,
      };
    }

    return config;
  },
};

export default nextConfig;
