import './lib/setup.js';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { createClient } from 'redis';

// Setup REDIS for caching
const redisClient = createClient({
	url: process.env.REDIS_URL
});
redisClient.on('error', (err) => container.logger.error(`[REDIS] ${err}`));

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	loadDefaultErrorListeners: true,
	logger: {
		level: LogLevel.Info
	},
	hmr: {
		enabled: process.env.NODE_ENV === 'development'
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
	}
}
