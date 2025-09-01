// next.config.js
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  webpack: (config) => {
    // Alias "@" to the project root
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

export default nextConfig;

