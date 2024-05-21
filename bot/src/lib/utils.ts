import {
	Result,
	UserError,
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload
} from '@sapphire/framework';
import { cyan } from 'colorette';
import { type APIUser, type Guild, type User } from 'discord.js';
import { deserialize, serialize } from 'binarytf';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}

export function titleCase(str: string) {
    if (!/[a-zA-Z]/.test(str.charAt(0))) {
        const nonLetterChar = str.charAt(0);
        const restOfString = str.slice(1).toLowerCase();
        return nonLetterChar + restOfString.replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
}

export function compressCustomIDMetadata<T>(metadata: T) {
	const serialized = brotliCompressSync(serialize<T>(metadata)).toString('binary');
	console.log(`${serialized.length}: ${JSON.stringify(metadata)}: ${serialized}`)
	if (serialized.length > 80) {
		console.log(`Too Big Metadata: ${serialized.length}: ${JSON.stringify(metadata)}`)
		throw new UserError({
			identifier: 'CustomIDMetadataTooLarge',
			message: 'The provided metadata is too large to be stored in a custom ID!\nReach out to support for more informtion :)'
		})
	}
	return serialized;
}

export function decompressCustomIDMetadata<T>(content: string) {
	const result = Result.from<T, Error>(() =>
		deserialize<T>(brotliDecompressSync(Buffer.from(content, 'binary')))
	)
	return result.match({
		ok: (value) => value,
		err: (error) => {
			console.error(error)
			throw new UserError({
				identifier: 'CustomIDMetadataDecompressionFailed',
				message: 'Failed to decompress the metadata from the custom ID. Please reach out to support for more information.',
			})
		}
	})
}