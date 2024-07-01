import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { StoreRegistryValue } from '@sapphire/pieces';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';

const dev = process.env.NODE_ENV !== 'production';

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public override run() {
		this.printBanner();
		this.printStoreDebugInformation();
		this.printStatistics();
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];

		for (const store of stores) logger.info(this.styleStore(store, false));
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
	private async printStatistics() {
		const statisticMessages: string[] = [
			`Loaded ${await this.container.db.customCards.count()} custom cards.`,
			`Loaded ${await this.container.db.guild.count()} guilds with custom cards.`,
			`Loaded ${this.container.client.guilds.cache.size} guilds.`,
			`Loaded ${this.container.client.channels.cache.size} channels.`,
			`Loaded ${this.container.client.users.cache.size} users.`,
			`Loaded ${await this.container.db.guildIntegration.count()} registered integrations.`,
		]
		const last = statisticMessages.pop()!;
		for (const message of statisticMessages) this.container.logger.info(this.printStatistic(message, false));
		this.container.logger.info(this.printStatistic(last, true));
	}
	private printStatistic(message: string, last: boolean) {
		return green(`${last ? '└─' : '├─'} ${message}`);
	}
}
