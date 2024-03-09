import { container } from '@sapphire/framework';
import { cardNameRegex } from './constants.js';
import { EmbedBuilder, Message } from 'discord.js';
import { titleCase } from './utils.js';
import Scry, { Card } from 'scryfall-sdk';
import { RedisTTLDurations } from './constants.js';
import { PublicPaginatedMessage } from './extensions/PaignatedMessages.js';
import { manamoji } from './emojis.js';

export class CardFetcher {
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
	async runFetch(cardsSet: Set<string>, message: Message) {
		const CardsData: any[] = [];
		try {
			const cards = Array.from(cardsSet);
			await Promise.all(
				cards.map(async (val) => {
					try {
						const card = (await this.getCardByName(val)) as any;
						container.logger.debug(`${this.logPrefix} ${message.id} - Found card info for ${card.name}`);
						card.found = true;
						CardsData.push(card);
					} catch (err: any) {
						container.logger.debug(`${this.logPrefix} ${message.id} - ${err.message}`);
						CardsData.push(err);
					}
				})
			);
		} catch (err: any) {
			container.logger.error(`${this.logPrefix} ${message.id} - Error fetching cards: ${err.message}`);
		}
        return CardsData;
	}
	async sendEmbeds(CardsData: any[], message: Message) {
		// Gen embeds
		const embeds: any[] = [];
		CardsData.forEach((card) => {
			if (card.found) {
				const embed = this.createCardEmbed(card);
				embeds.push(embed);
			} else {
				const embed = new EmbedBuilder().setTitle('Lookup Error!').setDescription(card.message);
				embeds.push(embed);
			}
		});
		container.logger.debug(`[messageCreate] ${message.id} - Finished generating embeds!`);
		this.displayCardList(embeds, message);
	}
	async getCardByName(name: string) {
		if (!name) throw new Error('No name provided');
		if (!(await container.redis.exists(`card:${name}`))) {
			const card = await Scry.Cards.byName(name, true);
			// @ts-expect-error
			if (card.object == 'error' && card.status == 404) {
				throw {
					// @ts-expect-error
					message: card.details,
					name: name,
					found: false
				};
			} else {
				container.logger.debug(`${name} not found in the cache, adding it.`);
				await container.redis.set(`card:${name}`, JSON.stringify(card));
				await container.redis.expire(`card:${name}`, RedisTTLDurations['WEEK']);
				return card;
			}
		} else return JSON.parse(String(await container.redis.get(`card:${name}`)));
	}
	createCardEmbed(card: Card) {
		const embed = new EmbedBuilder()
			.setTitle(`${card.name} ${manamoji(String(card.mana_cost), )}`)
			.setDescription(manamoji(`${String(card.type_line)}\n${card.oracle_text}`))
			.setURL(card.scryfall_uri)
			.setThumbnail(card.image_uris ? card.image_uris.normal : null);
		return embed;
	}
	displayCardList(embeds: any[], message: Message) {
		// Send embeds
		if (embeds.length <= 5) message.channel.send({ embeds: embeds });
		else {
			const paignatedMessage = new PublicPaginatedMessage();
			embeds.map((embed) => {
				paignatedMessage.addPageEmbed(embed);
			});
			paignatedMessage.run(message);
		}
	}
}
