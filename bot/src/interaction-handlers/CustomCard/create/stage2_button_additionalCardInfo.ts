import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import { CustomIDPrefixes } from '../../../lib/constants.js';
import { ICustomCardCreateButtonCustomIDMetadata } from './stage1_modal.js';
import { decompressCustomIDMetadata } from '../../../lib/utils.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		// Modal Time!!!
		const customIDMetadata = interaction.customId.replaceAll(`${CustomIDPrefixes.cc_stage_2_long}additional_info:`, '');
		const { cardID } = decompressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>(customIDMetadata);
		const cardRow = await this.container.db.customCards.findUnique({
			where: { id: cardID }
		});
		if (!cardRow) throw new UserError({
			identifier: 'CardNotFound',
			message: 'The card was not found. Please reach out to support for more information.'
		});
		const modal = new ModalBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_stage_3_long}additional_info:${customIDMetadata}`)
			.setTitle(cardRow.name);
		const collectorNumber = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}collector_number`)
			.setLabel('Collector Number')
			.setPlaceholder('Enter the collector number')
			.setStyle(TextInputStyle.Short)
			.setRequired(false);
		const collectorNumberRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
			.addComponents(collectorNumber);
		const artist = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}artist`)
			.setLabel('Artist')
			.setPlaceholder('Enter the atists name')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);
		const artistRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
			.addComponents(artist);
		modal.addComponents(collectorNumberRow, artistRow);
		return await interaction.showModal(modal);
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_2_long}additional_info:`)) return this.some();
		return this.none();
	}
}
