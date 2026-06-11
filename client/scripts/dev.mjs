import config from '../vite.config.js';
import { createServer } from 'vite';

const server = await createServer({ ...config, configFile: false });
await server.listen();
server.printUrls();
