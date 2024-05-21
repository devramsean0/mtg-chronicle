import { UserError, container } from '@sapphire/framework';
import { customCardNameRegex, normalCardNameRegex } from './constants.js';
import { EmbedBuilder, Message } from 'discord.js';
import { titleCase } from './utils.js';
import Scry, { Card } from 'scryfall-sdk';
import { RedisTTLDurations } from './constants.js';
import { PublicPaginatedMessage } from './extensions/PaignatedMessages.js';
import { manamoji } from './emojis.js';
import { CustomCards } from '@prisma/client';
import { envParseString } from '@skyra/env-utilities';

export class CardFetcher {
	private paignation_enabled: boolean = true;
	private logPrefix: string = '';
	constructor(logPrefix: string) {
		this.logPrefix = logPrefix;
	}
	async parseForCards(message: Message) {
		const normalMatches = message.content.match(normalCardNameRegex);
		const customMatches = message.content.match(customCardNameRegex);
		if (!normalMatches && !customMatches) return;
		// Find Cards
		container.logger.info(`${this.logPrefix} ${message.id} - Found ${normalMatches?.length ?? 0} normal matches and ${customMatches?.length ?? 0} custom matches`);
		const normalCards = normalMatches?.map((match) => match.slice(2, -2)) ?? [];
		const customCards = customMatches?.map((match) => match.slice(2, -2)) ?? [];
		const normalNormalizedCards = new Set(normalCards.map((card) => titleCase(card)));
		const customNormalizedCards = new Set(customCards.map((card) => card));
		return { normalNormalizedCards, customNormalizedCards };
	}
	async multicardSend(cardsSet: { normalNormalizedCards: Set<string>, customNormalizedCards: Set<string>}, message: Message) {
		const normalCards = Array.from(cardsSet.normalNormalizedCards);
		const customCards = Array.from(cardsSet.customNormalizedCards);
		const embeds = [];
		for (const card of normalCards) {
			const initialChar = card.charAt(0);
			const name = card.replace(initialChar, '');
			let data;
			let embed;
			switch (initialChar) {
				case '!':
					data = await this.normalFetchCard(name);
					embed = this.createImageCardEmbed(data);
					embeds.push(embed);
					continue;
				case '#':
					data = await this.normalFetchCard(name);
					embed = this.createLegalityCardEmbed(data);
					embeds.push(embed);
					continue;
				case '$':
					data = await this.normalFetchCard(name);
					embed = this.createPriceCardEmbed(data);
					embeds.push(embed);
					continue;
				case ';':
					if (name == 'Disable_pagination') {
						this.paignation_enabled = false;
						container.logger.debug(`${this.logPrefix} ${message.id} - Pagination disabled`);
					}
					continue;
				default:
					data = await this.normalFetchCard(card);
					embed = this.createInfoCardEmbed(data);
					embeds.push(embed);
			}

		}
		for (const card of customCards) {
			const initialChar = card.charAt(0);
			const name = card.replace(initialChar, '');
			let data;
			let embed;
			switch (initialChar) {
				case '!':
					data = await this.customFetchCard(name, message);
					embed = this.createImageCustomCardEmbed(data);
					embeds.push(embed);
					continue;
				default:
					data = await this.customFetchCard(card, message);
					embed = await this.createInfoCustomCardEmbed(data);
					embeds.push(embed);
			}
		}
		this.displayCardList(embeds, message);
	}
	async normalFetchCard(name: string) {
		if (!name) throw new Error('No name provided');
		if (!(await container.redis.exists(`card:${name}`))) {
			const card = await Scry.Cards.byName(name, true);
			// @ts-expect-error
			if (card.object == 'error' && card.status == 404) {
				throw {
					// @ts-expect-error
					message: card.details,
					name: name,
				};
			} else {
				container.logger.debug(`${name} not found in the cache, adding it.`);
				await container.redis.set(`card:${name}`, JSON.stringify(card));
				await container.redis.expire(`card:${name}`, RedisTTLDurations['WEEK']);
				return card;
			}
		} else return JSON.parse(String(await container.redis.get(`card:${name}`)));
	}
	async customFetchCard(name: string, message: Message) {
		if (!name) throw new Error('No name provided');
		console.log(name, message.guild?.id)
		const card = await container.db.customCards.findFirst({
			where: {
				name: name,
				guild: {
					discord_id: String(message.guildId)
				}
			},
		});
		if (!card) throw new UserError({ identifier: 'CustomCardNotFound', message: 'Custom Card not found' });
		const imageRow = await container.db.customCardImage.findFirst({
			where: {
				id: card.customCardImageId
			},
		});
		if (!imageRow) throw new UserError({ identifier: 'CustomCardImageNotFound', message: 'Custom Card Image not found' });
		const keeperChannel = await container.client.channels.fetch(envParseString('KEEPER_CHANNEL_ID'));
		if (keeperChannel?.isTextBased()) {
			const imageMessage = await keeperChannel.messages.fetch(String(imageRow.message_id));
			// @ts-expect-error
			card.image_url = String(imageMessage.attachments.first()?.url);
			console.log(card)
			return card;
		}
		return card;
	}
	createInfoCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setDescription(manamoji(`${String(card.type_line)}\n${card.oracle_text}`))
			.setURL(card.scryfall_uri)
			.setThumbnail(card.image_uris ? card.image_uris.normal : null);
		return embed;
	}
	async createInfoCustomCardEmbed(card: CustomCards) {
		const imageRow = await container.db.customCardImage.findFirst({
			where: {
				id: card.customCardImageId
			},
		});
		if (!imageRow) throw new UserError({ identifier: 'CustomCardImageNotFound', message: 'Custom Card Image not found' });
		const keeperChannel = await container.client.channels.fetch(envParseString('KEEPER_CHANNEL_ID'));
		if (keeperChannel?.isTextBased()) {
			const imageMessage = await keeperChannel.messages.fetch(String(imageRow.message_id));
			const embed = new EmbedBuilder()
				.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
				.setDescription(manamoji(`${String(card.type_line)}\n${card.oracleText}`))
				.setThumbnail(String(imageMessage.attachments.first()?.url))
				.setFooter({
					text: `CUSTOM`
				})
			return embed;
		}
		else {
			const embed = new EmbedBuilder()
				.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
				.setDescription(manamoji(`${String(card.type_line)}\n${card.oracleText}`))
				.setFooter({
					text: `CUSTOM`
				})
			return embed;
		}
	}
	createImageCustomCardEmbed(card: CustomCards) {
		// @ts-expect-error
		console.log(card.card_url)
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			// @ts-expect-error
			.setImage(card.image_url ? card.image_url : null)
			.setFooter({
				text: `CUSTOM`
			});
		return embed;
	}
	createImageCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setImage(card.image_uris ? card.image_uris.normal : null)
			.setURL(card.scryfall_uri);
		return embed;
	}
	createLegalityCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setURL(card.scryfall_uri)
			.setThumbnail(card.image_uris ? card.image_uris.normal : null);
			for (const [key, value] of Object.entries(card.legalities)) {
				embed.addFields({ name: key.charAt(0).toUpperCase() + key.slice(1), value: (value.charAt(0).toUpperCase() + value.slice(1)).replace("_", " "), inline: true});
			}
		return embed;
	}
	createPriceCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setURL(card.scryfall_uri)
			.setThumbnail(card.image_uris ? card.image_uris.normal : null);
		if (card.prices) {
			for (const [key, value] of Object.entries(card.prices)) {
				const niceKey = (key.charAt(0).toUpperCase() + key.slice(1)).replace('_', ' ');
				if (value != null) {
					embed.addFields({ name: niceKey, value: value, inline: true});
				} else {
					embed.addFields({ name: niceKey, value: 'Unknown price', inline: true});
				}
			}
		} else {
			embed.setDescription('No price data available');
		}
		return embed;
	
	}
	displayCardList(embeds: any[], message: Message) {
		// Send embeds
		if (embeds.length == 0) return;
		if (embeds.length <= 5 || !this.paignation_enabled) message.channel.send({embeds: embeds.slice(0, 10).map((embed) => embed)});
		else {
			const paignatedMessage = new PublicPaginatedMessage();
			embeds.map((embed) => {
				paignatedMessage.addPageEmbed(embed);
			});
			paignatedMessage.run(message);
		}
	}
}