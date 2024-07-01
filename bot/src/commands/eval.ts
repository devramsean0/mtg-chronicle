import { ApplyOptions } from '@sapphire/decorators';
import { Command, Args } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Eval',
	preconditions: ['OwnerOnly']
})
export class EvalCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const code = await args.rest('string');
		try {
			const result = eval(code);
			return message.channel.send(`\`\`\`\n${result}\n\`\`\``);
		} catch (err) {
			return message.channel.send(`\`\`\`\n${err}\n\`\`\``);
		}
	}
}