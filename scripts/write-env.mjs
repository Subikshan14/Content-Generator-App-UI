import { writeFile } from 'node:fs/promises';

const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
const envFile = new URL('../public/env.json', import.meta.url);

await writeFile(envFile, `${JSON.stringify({ apiBaseUrl }, null, 2)}\n`);
console.log(`Wrote API base URL to ${envFile.pathname}`);
