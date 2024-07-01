import { LoaderStrategy } from '@sapphire/pieces';
import { Integration } from './integration.js';
import { IntegrationStore } from './integrationStore.js';
import cron from 'node-cron';
import { container } from '@sapphire/framework';
import { fetchGuildsWithIntegrations, runPieceUpdateCardsMethod } from '../integrationsLib.js';

export class IntegrationLoaderStrategy extends LoaderStrategy<Integration> {
    public override onLoad(_store: IntegrationStore, piece: Integration) {
        if (piece.cronSchedule) {
            // Initialize cron job
            if (cron.validate(piece.cronSchedule)) {
                const task = cron.schedule(piece.cronSchedule, async () => {
                    (await fetchGuildsWithIntegrations(piece.name)).map(async (guild) => {
                        container.logger.debug(`[integration]: Running ${piece.name} for guild ${guild.guildId}`);
                        await runPieceUpdateCardsMethod(guild, piece);
                    });
                }, {
                    runOnInit: true
                });
                container.cronCache.set(piece.name, task);
            } else {
                throw new Error(`Invalid cron schedule for ${piece.name}`);
            }
        }
    }
    public override onUnload(_store: IntegrationStore, piece: Integration) {
        if (piece.cronSchedule) {
            const task = container.cronCache.get(piece.name);
            if (task) {
                task.stop();
                container.cronCache.delete(piece.name);
            }
        }
    }
}