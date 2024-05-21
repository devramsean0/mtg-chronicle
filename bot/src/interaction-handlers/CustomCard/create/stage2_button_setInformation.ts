import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import { CustomIDPrefixes } from '../../../lib/constants.js';
import { decompressCustomIDMetadata } from '../../../lib/utils.js';
import { ICustomCardCreateButtonCustomIDMetadata } from './stage1_modal.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const customIDMetadata = interaction.customId.replaceAll(`${CustomIDPrefixes.cc_stage_2_long}set_information:`, '');
		const { cardID } = decompressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>(customIDMetadata);
		const cardRow = await this.container.db.customCards.findUnique({
			where: { id: cardID }
		});
		if (!cardRow) throw new UserError({
			identifier: 'CardNotFound',
			message: 'The card was not found. Please reach out to support for more information.'
		});
		const modal = new ModalBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_3_long}set_information:${customIDMetadata}`)
			.setTitle(cardRow.name);
		const setName = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}set_name`)
			.setLabel('Set Name')
			.setPlaceholder('Enter the set name')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const setNameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
			.addComponents(setName);
		const setNumber = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}set_code`)
			.setLabel('Set Code')
			.setPlaceholder('Enter the set code')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);
		const setNumberRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
			.addComponents(setNumber);
		modal.addComponents(setNameRow, setNumberRow);
		return await interaction.showModal(modal);
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_2_long}set_information`)) return this.some();
		return this.none();
	}
}
