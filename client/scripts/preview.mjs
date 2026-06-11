import config from '../vite.config.js';
import { preview } from 'vite';

const server = await preview({ ...config, configFile: false });
server.printUrls();
