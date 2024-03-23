import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { CardFetcher } from '../lib/cardFetcher.js';

@ApplyOptions<Listener.Options>({})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (message.author.bot) return;
		const cardFetcher = new CardFetcher(`[messageCreate]`);
		// Message Parsing for cards
		this.container.logger.debug(`[messageCreate] Recieved a message - ${message.id}`);
		const cardsSet = await cardFetcher.parseForCards(message);
		if (!cardsSet) return;
		await cardFetcher.multicardSend(cardsSet, message);
	}
}
