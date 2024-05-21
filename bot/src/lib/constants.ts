import { join } from 'path';

export const rootDir = /* join(__dirname, '..', '..'); */ process.cwd();
export const srcDir = join(rootDir, 'src');

// Regex
export const normalCardNameRegex = /\[\[([^\]]+)\]\]/g;
export const customCardNameRegex = /\<\<([^\>]+)\>\>/g;
export const manaValueRegex = /\{(.*?)\}/g;

// TTL
export enum RedisTTLDurations {
	SECOND = 1,
	MINUTE = 60,
	HOUR = 3600,
	DAY = 86400,
	WEEK = 604800,
	MONTH = 2592000,
	YEAR = 31536000
}

// Custom ID Shortenings
export enum CustomIDPrefixes {
	"cc_stage_1_long" = "customcard_1:",
	"cc_stage_2_long" = "customcard_2:",
	"cc_stage_3_long" = "customcard_3:",
	"cc_short" = "cc:"
}
