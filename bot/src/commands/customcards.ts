import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { compressCustomIDMetadata } from '../lib/utils.js';
import { CustomIDPrefixes } from '../lib/constants.js';

@ApplyOptions<Subcommand.Options>({
	description: 'Manage your Custom Cards',
	subcommands: [
		{
			name: 'create',
			chatInputRun: 'chatInputCreate'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
			.setName(this.name)
			.setDescription(this.description)
			.addSubcommand((subcommand) =>
				subcommand
				.setName('create')
				.setDescription('Create a new custom card')
				.addStringOption(option => (
					option
					.setName('name')
					.setDescription('The name of the card')
					.setRequired(true)
				))
				.addAttachmentOption(option => (
					option
					.setName('image')
					.setDescription('The image of the card')
					.setRequired(true)
				))
			)
		);
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputCommandInteraction) {
		console.log('Hello')
		const name = interaction.options.getString('name');
		const url = interaction.options.getAttachment('image')?.url;
		console.log('hello0.5')
		if (!name) return interaction.reply('You need to provide a name for the card!');
		if (!url) return interaction.reply('You need to provide an image for the card!');
		console.log('hello1')
		// We want to have the majority of the data input in a modal!
		// Modal 1: Oracle Text, Card Type, Mana Cost, Rarity, Power/Toughness
		const imageRow = await this.container.db.customCardImage.create({
			data: {
				original_image_url: url,
			}
		});
		const compressedCustomIDMetadata = compressCustomIDMetadata<ICustomCardCreateModalCustomIDMetadata>({name: name, image: imageRow.id})
		console.log('hello1.25')
		const modal = new ModalBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_1_long}:create:${compressedCustomIDMetadata}`)
			.setTitle(`${name} | 1`)
		console.log('hello1.5')
		const oracleTextComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}oracle_text`)
			.setLabel('Oracle Text')
			.setPlaceholder('Enter the Oracle Text')
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph);
		const oracleTextActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(oracleTextComponent);
		console.log('Hello2')
		const cardTypeComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}card_type`)
			.setLabel('Card Type')
			.setPlaceholder('Enter the Card Type')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const cardTypeActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(cardTypeComponent);
		console.log('Hello3')
		const manaCostComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}mana_cost`)
			.setLabel('Mana Cost')
			.setPlaceholder('Enter the Mana Cost in {W}{U}{B}{R}{G} format (if applicable)')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);
		const manaCostActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(manaCostComponent);
		console.log('Hello4')
		const rarityComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}rarity`)
			.setLabel('Rarity')
			.setPlaceholder('Enter the Rarity')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const rarityActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rarityComponent);
		console.log('Hello5')
		const powerToughnessComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}power_toughness`)
			.setLabel('Power/Toughness')
			.setPlaceholder('Enter the Power/Toughness (if applicable)')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);
		console.log('Hello6')
		const powerToughnessActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(powerToughnessComponent);
		modal.addComponents(oracleTextActionRow, cardTypeActionRow, manaCostActionRow, rarityActionRow, powerToughnessActionRow);
		console.log('Hello7')
		return await interaction.showModal(modal);
	}
}

export interface ICustomCardCreateModalCustomIDMetadata {
	name: string;
	image: number;
}