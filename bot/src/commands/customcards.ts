import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { compressCustomIDMetadata } from '../lib/utils.js';
import { CustomIDPrefixes } from '../lib/constants.js';
import { CardFetcher } from '../lib/cardFetcher.js';
import { ICustomCardCreateButtonCustomIDMetadata } from '../interaction-handlers/CustomCard/create/stage1_modal.js';

@ApplyOptions<Subcommand.Options>({
	description: 'Manage your Custom Cards',
	subcommands: [
		{
			name: 'create',
			chatInputRun: 'chatInputCreate'
		},
		{
			name: 'get',
			chatInputRun: 'chatInputGet'
		},
		{
			name: 'edit',
			chatInputRun: 'chatInputEdit'
		},
		{
			name: 'delete',
			chatInputRun: 'chatInputDelete'
		}
	],
	preconditions: ['ServerManager']
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
			.addSubcommand((subcommand) =>
				subcommand
				.setName('get')
				.setDescription('Get a custom card')
				.addStringOption(option => (
					option
					.setName('name')
					.setDescription('The name of the card')
					.setRequired(true)
					.setAutocomplete(true)
				))
			)
			.addSubcommand((subcommand) => (
				subcommand
				.setName('edit')
				.setDescription('Edit a custom card')
				.addStringOption(option => (
					option
					.setName('name')
					.setDescription('The name of the card')
					.setRequired(true)
					.setAutocomplete(true)
				))
				.addAttachmentOption(option => (
					option
					.setName('image')
					.setDescription('The image of the card')
					.setRequired(false)
				))
			))
			.addSubcommand((subcommand) => (
				subcommand
				.setName('delete')
				.setDescription('Delete a custom card')
				.addStringOption(option => (
					option
					.setName('name')
					.setDescription('The name of the card')
					.setRequired(true)
					.setAutocomplete(true)
				))
			))
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
		console.log('hello1.1')
		const compressedCustomIDMetadata = compressCustomIDMetadata<ICustomCardCreateModalCustomIDMetadata>({name: name, image: imageRow.id})
		console.log('hello1.25')
		const modal = new ModalBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_1_long}create:${compressedCustomIDMetadata}`)
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
	public async chatInputGet(interaction: Subcommand.ChatInputCommandInteraction) {
		const name = interaction.options.getString('name');
		if (!name) return interaction.reply('You need to provide a name for the card!');
		const cardRow = await this.container.db.customCards.findFirst({
			where: {
				name: name,
				guild: {
					discord_id: String(interaction.guild?.id)
				}
			}
		});
		if (!cardRow) return interaction.reply('The card was not found!');
		const cardFetcher = new CardFetcher(`${CustomIDPrefixes.cc_short}:${name}`);
		const embed = await cardFetcher.createInfoCustomCardEmbed(cardRow);
		return interaction.reply({ embeds: [embed] });
	}
	public async chatInputEdit(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const name = interaction.options.getString('name');
		if (!name) return interaction.editReply('You need to provide a name for the card!');
		const cardRow = await this.container.db.customCards.findFirst({
			where: {
				name: name,
				guild: {
					discord_id: String(interaction.guild?.id)
				}
			}
		});
		if (!cardRow) return interaction.editReply('The card was not found!');
		if (interaction.options.getAttachment('image')) {
			// If new image is provided, update the image
			const url = interaction.options.getAttachment('image')?.url;
			const imageRow = await this.container.db.customCardImage.create({
				data: {
					original_image_url: String(url),
				}
			});
			await this.container.db.customCards.update({
				where: {
					id: cardRow.id
				},
				data: {
					customCardImageId: imageRow.id
				}
			});
			if (cardRow.customCardImageId) {
				// Delete the old image (ID is pulled from previously created object)
				await this.container.db.customCardImage.delete({
					where: {
						id: cardRow.customCardImageId
					}
				});
			}
		}
		const compressedMetadata = compressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>({ cardID: cardRow.id });
		const aditionalCardInfoButton = new ButtonBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_2_long}additional_info:${compressedMetadata}`)
			.setLabel('Additional Card Info')
			.setStyle(ButtonStyle.Secondary);
		const cardInfo = new ButtonBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_2_long}card_info:${compressedMetadata}`)
			.setLabel('Card Info')
			.setStyle(ButtonStyle.Primary);
		const setInformation = new ButtonBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_2_long}set_information:${compressedMetadata}`)
			.setLabel('Set Information')
			.setStyle(ButtonStyle.Secondary);
		const actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(aditionalCardInfoButton, setInformation, cardInfo);
		return await interaction.editReply({
			content: 'What would you like to edit?',
			components: [actionRow],
		})
	}
	public async chatInputDelete(interaction: Subcommand.ChatInputCommandInteraction) {
		const name = interaction.options.getString('name');
		if (!name) return interaction.reply('You need to provide a name for the card!');
		const cardRow = await this.container.db.customCards.findFirst({
			where: {
				name: name,
				guild: {
					discord_id: String(interaction.guild?.id)
				}
			}
		});
		if (!cardRow) return interaction.reply('The card was not found!');
		await this.container.db.customCards.delete({
			where: {
				id: cardRow.id
			}
		});
		if (cardRow.customCardImageId) {
			await this.container.db.customCardImage.delete({
				where: {
					id: cardRow.customCardImageId
				}
			});
		}
		return interaction.reply('The card has been deleted!');
	}
	// Autocomplete!!!
	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const focused = interaction.options.getFocused(true);
		switch (focused.name) {
			case 'name':
				const result = await this.container.db.customCards.findMany({
					where: {
						guild: {
							discord_id: String(interaction.guildId)
						},
						name: {
							contains: focused.value
						}
					}
				})
				const parsed = result.map((match) => ({name: match.name, value: match.name}));
				return interaction.respond(parsed.slice(0, 25));
			default:
				return [];
		}
	}
}

export interface ICustomCardCreateModalCustomIDMetadata {
	name: string;
	image: number;
}