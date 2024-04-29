import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import { CustomIDPrefixes } from '../../../lib/constants.js';
import { ICustomCardCreateButtonCustomIDMetadata } from '../create/stage1_modal.js';
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
			.setCustomId(`${CustomIDPrefixes.cc_stage_3_long}card_info:${customIDMetadata}`)
			.setTitle(cardRow.name);
		const oracleTextComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}oracle_text`)
			.setLabel('Oracle Text')
			.setPlaceholder('Enter the Oracle Text')
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph);
		const oracleTextActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(oracleTextComponent);
		const cardTypeComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}card_type`)
			.setLabel('Card Type')
			.setPlaceholder('Enter the Card Type')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const cardTypeActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(cardTypeComponent);
		const manaCostComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}mana_cost`)
			.setLabel('Mana Cost')
			.setPlaceholder('Enter the Mana Cost in {W}{U}{B}{R}{G} format (if applicable)')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);
		const manaCostActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(manaCostComponent);
		const rarityComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}rarity`)
			.setLabel('Rarity')
			.setPlaceholder('Enter the Rarity')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const rarityActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rarityComponent);
		const powerToughnessComponent = new TextInputBuilder()
			.setCustomId(`${CustomIDPrefixes.cc_short}power_toughness`)
			.setLabel('Power/Toughness')
			.setPlaceholder('Enter the Power/Toughness (if applicable)')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);
		const powerToughnessActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(powerToughnessComponent);
		modal.addComponents(oracleTextActionRow, cardTypeActionRow, manaCostActionRow, rarityActionRow, powerToughnessActionRow);
		return await interaction.showModal(modal);
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith(`${CustomIDPrefixes.cc_stage_2_long}card_info:`)) return this.some();
		return this.none();
	}
}
