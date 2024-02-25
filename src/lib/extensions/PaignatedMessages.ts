import { PaginatedMessage, PaginatedMessageInteractionUnion } from "@sapphire/discord.js-utilities";
import { Message, User } from "discord.js";

export class PublicPaginatedMessage extends PaginatedMessage {
    override handleCollect(targetUser: User, channel: Message['channel'], interaction: PaginatedMessageInteractionUnion): Promise<void> {
        targetUser.id = interaction.user.id;
        return super.handleCollect(targetUser, channel, interaction);
    }
}