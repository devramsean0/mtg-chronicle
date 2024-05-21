import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';

@ApplyOptions<Command.Options>({
	description: 'Information about MTG Chronicle'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const packageJSON = JSON.parse(await fs.readFile(`${process.cwd()}/package.json`, 'utf-8'));
		const embed = new EmbedBuilder()
			.setTitle('MTG Chronicle')
			.setDescription('MTG Chronicle is a bot that allows you to display custom and official MTG cards in discord\nOfficial Card Information is sourced from Scryfall.')
			.addFields({
				name: 'Discord.js Version',
				value: packageJSON.dependencies['discord.js'],
			},
			{
				name: 'Sapphirejs Version',
				value: packageJSON.dependencies['@sapphire/framework'],
			},
			{
				name: 'Node.js Version',
				value: process.version,
			});
		const ActionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Invite')
					.setStyle(ButtonStyle.Link)
					.setURL('https://discord.com/oauth2/authorize?client_id=1211325908024295444&permissions=67584&scope=bot+applications.commands'),
				new ButtonBuilder()
					.setLabel('Copyright Notice')
					.setStyle(ButtonStyle.Link)
					.setURL('https://github.com/devramsean0/mtg-chronicle/blob/main/docs/COPYRIGHT.md'),
				new ButtonBuilder()
					.setLabel('Source Code')
					.setStyle(ButtonStyle.Link)
					.setURL('https://github.com/devramsean0/mtg-chronicle')
			)
		interaction.reply({ embeds: [embed], components: [ActionRow] });
	}
}
