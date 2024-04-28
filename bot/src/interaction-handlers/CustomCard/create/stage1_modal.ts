import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type ModalSubmitInteraction } from 'discord.js';
import { CustomIDPrefixes } from '.././../../lib/constants.js';
import { envParseString } from '@skyra/env-utilities';
import { compressCustomIDMetadata, decompressCustomIDMetadata } from '../../../lib/utils.js';
import { ICustomCardCreateModalCustomIDMetadata } from '../../../commands/customcards.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
	name: 'customcards:stage1_modal'
})
export class ModalHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		await interaction.deferReply({ ephemeral: true });
		// Send attachment to keeper channel
		const channel_id = envParseString('KEEPER_CHANNEL_ID');
		const channel = await interaction.client.channels.fetch(channel_id);
		if (!channel) return new UserError({
			identifier: 'KeeperChannelNotFound',
			message: 'The Keeper channel was not found. Please reach out to support for more information.'
		});
		if (!channel.isTextBased()) return new UserError({
			identifier: 'KeeperChannelNotFound',
			message: 'The Keeper channel was not found. Please reach out to support for more information.'
		});;
		const customIDMetadata = interaction.customId.replaceAll(`${CustomIDPrefixes.cc_stage_1_long}:create:`, '')
		console.log(interaction.customId, customIDMetadata)
		const { image, name } = decompressCustomIDMetadata<ICustomCardCreateModalCustomIDMetadata>(customIDMetadata);
		const imageRow = await this.container.db.customCardImage.findUnique({
			where: { id: image }
		});
		if (!imageRow) return new UserError({
			identifier: 'ImageNotFound',
			message: 'The image was not found. Please reach out to support for more information.'
		});
		const imageMessage = await channel.send({
			content: `${name} by ${interaction.user.username} in ${interaction.guildId}`,
			files: [String(imageRow?.original_image_url)]
		});
		// Save current to DB
		const powerToughness = interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}power_toughness`);
		const splitPowerToughness = powerToughness ? powerToughness.split('/') : [0, 0]
		const dbGuild =await this.container.db.guild.upsert({
			where: {  discord_id: String(interaction.guildId)},
			create: {
				name: String(interaction.guild?.name),
				discord_id: String(interaction.guildId)
			},
			update: {
				name: String(interaction.guild?.name)
			}
		})
		const customCardRow = await this.container.db.customCards.create({
			data: {
				customCardImageId: imageRow.id,
				name,
				oracleText: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}oracle_text`),
				type_line: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}card_type`),
				mana_cost: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}mana_cost`),
				rarity: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}rarity`),
				...(powerToughness ? { // Spread operator to conditionally include keys
					power: Number(splitPowerToughness[0]),
					toughness: Number(splitPowerToughness[1])
				} : {}), // Empty object if powerToughness is not defined
				guildId: dbGuild.id
			}
		})
		await this.container.db.customCardImage.update({
			where: { id: imageRow.id },
			data: { message_id: imageMessage.id }
		})
		const compressedMetadata = compressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>({ cardID: customCardRow.id });
		// Send the selection method for next steps
		const aditionalCardInfoButton = new ButtonBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_2_long}additional_info:${compressedMetadata}`)
			.setLabel('Additional Card Info')
			.setStyle(ButtonStyle.Primary);
		const setInformation = new ButtonBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_2_long}set_information:${compressedMetadata}`)
			.setLabel('Set Information')
			.setStyle(ButtonStyle.Primary);
		const actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(aditionalCardInfoButton, setInformation);
		
		return await interaction.editReply({
			content: 'What would you like to do next?',
			components: [actionRow],
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_1_long}:create:`)) return this.some();
		return this.none();
	}
}

export interface ICustomCardCreateButtonCustomIDMetadata {
	cardID: string;
}