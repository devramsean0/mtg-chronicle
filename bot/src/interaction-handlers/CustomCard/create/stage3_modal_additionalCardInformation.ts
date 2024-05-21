import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { CustomIDPrefixes } from '../../../lib/constants.js';
import { decompressCustomIDMetadata } from '../../../lib/utils.js';
import { ICustomCardCreateButtonCustomIDMetadata } from './stage1_modal.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		const customIDMetadata = interaction.customId.replaceAll(`${CustomIDPrefixes.cc_stage_3_long}additional_info:`, '');
		const { cardID } = decompressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>(customIDMetadata);
		await this.container.db.customCards.update({
			where: { id: cardID },
			data: {
				artist: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}artist`),
				... (interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}collector_number`) ? {
					collectorNumber: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}collector_number`)
				} : {})
			}
		})
		return await interaction.reply({
			content: 'Saved!',
			ephemeral: true
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_3_long}additional_info:`)) return this.some();
		else return this.none();
	}
}
