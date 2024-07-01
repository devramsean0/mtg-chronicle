import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';

@ApplyOptions<Subcommand.Options>({
	description: 'Manage your Integrations',
	preconditions: ['ServerManager'],
	subcommands: [
		{
			name: 'register',
			chatInputRun: 'chatInputRegister'
		},
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('register')
						.setDescription('Register an Integration')
						.addStringOption((option) =>
							option
								.setName('integration')
								.setDescription('The Integration to register')
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName('key')
								.setDescription('The key for the Integration')
								.setRequired(true)
						)
				)

		);
	}

	public async chatInputRegister(interaction: Subcommand.ChatInputCommandInteraction) {
		const integration = interaction.options.getString('integration', true);
		const key = interaction.options.getString('key', true);
		const piece = this.container.stores.get('integrations').get(integration);
		if (piece === undefined) return interaction.reply({ content: `Integration ${integration} not found`, ephemeral: true });
		if (interaction.guild === null) return;

		if (!piece.gatedTo?.includes(interaction.guild.id)) return interaction.reply({ content: `Integration ${integration} is not allowed in this server`, ephemeral: true });
		
		const DBguild = await this.container.db.guild.upsert({
			where: { discord_id: interaction.guild.id},
			create: { name: interaction.guild.name, discord_id: interaction.guild.id },
			update: {}
		});
		/*const DBintegration = */await this.container.db.guildIntegration.create({
			data: {
				guildId: DBguild.id,
				Integration: integration,
				auth_token: key
			}
		})
		//console.log(DBintegration)
		piece.fetchCards(DBguild.discord_id, key)
		return interaction.reply({ content: `Integration ${integration} registered`})
	}
}
