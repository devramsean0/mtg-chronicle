import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import { cardNameRegex } from '../lib/constants.js';
import { getCardByName } from '../lib/scryfall.js';
import { createCardEmbed } from '../lib/utils.js';
import { PublicPaginatedMessage } from '../lib/extensions/PaignatedMessages.js';

@ApplyOptions<Listener.Options>({})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (message.author.bot) return;
		// Message Parsing for cards
		this.container.logger.debug(`[messageCreate] Recieved a message - ${message.id}`)
		const matches = message.content.match(cardNameRegex);
		if (!matches) return;
		// Find Cards
		this.container.logger.info(`[messageCreate] ${message.id} - Found ${matches.length} matches`)
		const cards = matches.map(match => match.slice(2, -2));
		const CardsData: any[] = [];
		try {
			await Promise.all(cards.map(async (val) => {
				try {
					const card = await getCardByName(val) as any;
					this.container.logger.debug(`[messageCreate] ${message.id} - Found card info for ${card.name}`)
					card.found = true;
					CardsData.push(card);
				} catch (err: any) {
					this.container.logger.debug(`[messageCreate] ${message.id} - ${err.message}`)
					CardsData.push(err);
				}
			}));
		} catch (err: any) {
			this.container.logger.error(`[messageCreate] ${message.id} - Error fetching cards: ${err.message}`);
		}
		// Gen embeds
		const embeds: any[] = [];
		CardsData.forEach((card) => {
			if (card.found) {
				const embed = createCardEmbed(card);
				embeds.push(embed);
			} else {
				const embed = new EmbedBuilder()
					.setTitle("Lookup Error!")
					.setDescription(card.message)
				embeds.push(embed);
			}
		})
		// Send embeds
		if (embeds.length <= 5 ) message.channel.send({ content: "I found these cards in your message!", embeds: embeds });
		else {
			const paignatedMessage = new PublicPaginatedMessage();
			embeds.map((embed) => {
				paignatedMessage.addPageEmbed(embed);
			})

			paignatedMessage.run(message);
		}
	}
}
