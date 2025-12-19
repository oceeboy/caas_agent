import type { NextConfig } from 'next';

const BACKEND_URL =
  process.env.BACKEND_URL ??
  'http://localhost:4123/api/v1';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy REST/HTTP API to backend
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
      // Proxy Socket.IO/WebSocket endpoint to backend
      {
        source: '/socket.io/:path*',
        destination: `${BACKEND_URL}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
