import './lib/setup.js';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';

// Setup REDIS for caching
const redisClient = createClient({
	url: process.env.REDIS_URL
});
redisClient.on('error', (err) => container.logger.error(`[REDIS] ${err}`));

// Setup DB
const prisma = new PrismaClient();
container.db = prisma;

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	loadDefaultErrorListeners: true,
	logger: {
		level: LogLevel.Debug
	},
	hmr: {
		enabled: process.env.NODE_ENV === 'development'
	},
	api: {
		prefix: '',
		origin: '*',
		listenOptions: {
			port: 3000
		}
	},
	shards: 'auto'
});

const main = async () => {
	try {
		// Redis
		await redisClient.connect();
		// Modify Container
		container.redis = redisClient;
		container.cardCache = new Map<string, any>();
		client.logger.info('Connected to Redis');
		await container.db.$connect();
		client.logger.info('Connected to DB');
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();

declare module '@sapphire/pieces' {
	interface Container {
		redis: typeof redisClient;
		cardCache: Map<string, any>;
		db: PrismaClient;
	}
}

declare module '@skyra/env-utilities' {
	interface Env {
		KEEPER_CHANNEL_ID: string;
	}
}