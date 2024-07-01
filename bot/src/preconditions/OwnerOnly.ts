import { Precondition } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

export class UserPrecondition extends Precondition {
	public override messageRun(message: Message) {
		if (message.author.id == envParseString('OWNER_ID')) return this.ok();
		return this.error({ message: 'This command can only be used by the bot owner.'})
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		if (interaction.user.id == envParseString('OWNER_ID')) return this.ok();
		return this.error({ message: 'This command can only be used by the bot owner.'})
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (interaction.user.id == envParseString('OWNER_ID')) return this.ok();
		return this.error({ message: 'This command can only be used by the bot owner.'})
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
	}
}
