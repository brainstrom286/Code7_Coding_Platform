import config from '../vite.config.js';
import { build } from 'vite';

await build({ ...config, configFile: false });
