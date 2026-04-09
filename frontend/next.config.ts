import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  logging: {
    incomingRequests: false,
    browserToTerminal: false,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
