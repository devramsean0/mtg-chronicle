import { container } from '@sapphire/framework';
import { cardNameRegex } from './constants.js';
import { EmbedBuilder, Message } from 'discord.js';
import { titleCase } from './utils.js';
import Scry, { Card } from 'scryfall-sdk';
import { RedisTTLDurations } from './constants.js';
import { PublicPaginatedMessage } from './extensions/PaignatedMessages.js';
import { manamoji } from './emojis.js';

export class CardFetcher {
	private paignation_enabled: boolean = true;
	private logPrefix: string = '';
	constructor(logPrefix: string) {
		this.logPrefix = logPrefix;
	}
	async parseForCards(message: Message) {
		const matches = message.content.match(cardNameRegex);
		if (!matches) return;
		// Find Cards
		container.logger.info(`${this.logPrefix} ${message.id} - Found ${matches.length} matches`);
		const cards = matches.map((match) => match.slice(2, -2));
		const normalizedCards = new Set(cards.map((card) => titleCase(card)));
		return normalizedCards;
	}
	async multicardSend(cardsSet: Set<string>, message: Message) {
		const cards = Array.from(cardsSet);
		const embeds = [];
		for (const card of cards) {
			const initialChar = card.charAt(0);
			const name = card.replace(initialChar, '');
			let data;
			let embed;
			switch (initialChar) {
				case '!':
					data = await this.fetchCard(name);
					embed = this.createImageCardEmbed(data);
					embeds.push(embed);
					continue;
				case '#':
					data = await this.fetchCard(name);
					embed = this.createLegalityCardEmbed(data);
					embeds.push(embed);
					continue;
				case '$':
					data = await this.fetchCard(name);
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
					data = await this.fetchCard(card);
					embed = this.createInfoCardEmbed(data);
					embeds.push(embed);
			}

		}
		this.displayCardList(embeds, message);
	}
	async fetchCard(name: string) {
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
	createInfoCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setDescription(manamoji(`${String(card.type_line)}\n${card.oracle_text}`))
			.setURL(card.scryfall_uri)
			.setThumbnail(card.image_uris ? card.image_uris.normal : null);
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
