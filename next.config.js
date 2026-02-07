/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 環境變數
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  },

  // 圖片優化
  images: {
    domains: ['api.mapbox.com'],
  },

  // Webpack 配置（支援 D3.js）
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
