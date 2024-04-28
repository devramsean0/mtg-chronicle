import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { CustomIDPrefixes } from '../../../lib/constants.js';
import { decompressCustomIDMetadata } from '../../../lib/utils.js';
import { ICustomCardCreateButtonCustomIDMetadata } from './stage1_modal.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		const customIDMetadata = interaction.customId.replaceAll(`${CustomIDPrefixes.cc_stage_3_long}set_information:`, '');
		const { cardID } = decompressCustomIDMetadata<ICustomCardCreateButtonCustomIDMetadata>(customIDMetadata);
		await this.container.db.customCards.update({
			where: { id: cardID },
			data: {
				setName: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}set_name`),
				... (interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}set_code`) ? {
					setCode: interaction.fields.getTextInputValue(`${CustomIDPrefixes.cc_short}set_code`)
				} : {})
			}
		})
		return await interaction.reply({
			content: 'Saved!',
			ephemeral: true
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_3_long}set_information:`)) return this.some();
		else return this.none();
	}
}
