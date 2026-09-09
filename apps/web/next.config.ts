import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @onyx/core e' publicado como TypeScript de origem, sem build step
  transpilePackages: ['@onyx/core'],
  typedRoutes: true,
};

export default nextConfig;
