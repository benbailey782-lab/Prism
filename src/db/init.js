import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from './schema.js';

console.log('Initializing Sales Brain database...');
initDatabase();
console.log('Done!');
