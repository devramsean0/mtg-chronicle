import { join } from 'path';

export const rootDir = /* join(__dirname, '..', '..'); */ process.cwd();
export const srcDir = join(rootDir, 'src');

// Regex
export const cardNameRegex = /\[\[([^\]]+)\]\]/g;