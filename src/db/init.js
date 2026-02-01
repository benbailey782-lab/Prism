import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from './schema.js';

console.log('Initializing Prism database...');
initDatabase();
console.log('Done!');
