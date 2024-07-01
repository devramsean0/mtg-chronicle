import { GuildIntegration } from "@prisma/client";
import { container } from "@sapphire/framework";
import { Integration } from "./structures/integration.js";

export async function fetchGuildsWithIntegrations(integrationName: string) {
    const allIntegrations = await container.db.guildIntegration.findMany();
    const activeIntegrations = allIntegrations.filter((integration) => integration.Integration = integrationName);
    return activeIntegrations;
}

export async function runPieceUpdateCardsMethod(guildIntegration: GuildIntegration, piece: Integration) {
    const DBGuild = await container.db.guild.findUnique({
        where: {
            id: String(guildIntegration.guildId)
        }
    })
    if (!DBGuild) {
        container.logger.error(`Guild ${guildIntegration.guildId} not found in DB`);
        return;
    }
    await piece.fetchCards(DBGuild.discord_id, guildIntegration.auth_token);
}