import { Precondition } from '@sapphire/framework';
import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';

export class UserPrecondition extends Precondition {

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		const subdomain = interaction.options.getSubcommand();
		if (subdomain == 'get') return this.ok();
		if (!interaction.inCachedGuild()) this.container.client.guilds.fetch(String(interaction.guild));
		if ((interaction.member?.permissions as PermissionsBitField).has(PermissionsBitField.Flags.ManageGuild)) return this.ok(); // This is valid as the line above will cache it if it isn't cached
		return this.error({ message: 'Only those who can manage this server can use this command' });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		ServerManager: never;
	}
}
