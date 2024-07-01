import { ApplyOptions } from "@sapphire/decorators";
import { Integration } from "../lib/structures/integration.js";

@ApplyOptions<Integration.Options>({
    description: 'Candid Integration',
    cronSchedule: '*/30 * * * *',
    gatedTo: ['1167237306898464788', '924620240002887700']
})
export class CandidIntegration extends Integration {

}