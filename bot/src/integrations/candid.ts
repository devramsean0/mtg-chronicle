import { ApplyOptions } from "@sapphire/decorators";
import { Integration } from "../lib/structures/integration.js";
import { fetch } from '@sapphire/fetch';
import { Guild } from "@prisma/client";

@ApplyOptions<Integration.Options>({
    description: 'Candid Integration',
    cronSchedule: '0 */2 * * *',
    gatedTo: ['1167237306898464788', '924620240002887700'],
    baseURL: 'http://candid.dekalisk.com'
})
export class CandidIntegration extends Integration {
    public override async fetchCards(guildId: string, auth: string) {
        await this.container.db.$connect();
        const guild = await this.container.db.guild.findFirst({
            where: {
                discord_id: guildId
            }
        });
        if (!guild) throw new Error(`[integrations]: [candid]: Guild ${guildId} not found in DB`);
        const res = await fetch<ICandidSearchResponse>(`${this.baseURL}/search`, {
            headers: {
                Authorization: auth
            }
        });
        await this.processPage(res.matches, guild);
        let totalPages = res.maxPages;
        this.container.logger.debug(`[integrations]: [candid]: Total pages: ${totalPages}`)
        for (let i = 2; i <= totalPages; i++) {
            const res = await fetch<ICandidSearchResponse>(`${this.baseURL}/search?pageNum=${i}`, {
                headers: {
                    Authorization: auth
                }
            });
            await this.processPage(res.matches, guild);
        }
    }

    private getImageUrl(name: string) {
        if (typeof name == "undefined") return "" // TODO: Placeholder image
        const components = name.split('_');
        return `${this.baseURL}/img/${components[0]}/${components[1]}`
    }
    private async processPage(matches: ICandidSearchMatches[], guild: Guild) {
        for (const match of matches) {
            const data = {
                name: match.name,
                mana_cost: match.manaCosts.join(''),
                power: match.power,
                toughness: match.toughness,
                type_line: `${match.types.join(' ')} - ${match.subtypes.join(' ')}`,
                collectorNumber: match.cardNumber,
                rarity: Rarity[match.rarity], 
                setName: 'Candor',
                setCode: 'CA0',
                oracleText: match.oracle.join('\n'),
                imageUrl: this.getImageUrl(match.imgExists[0]),
            }
            const existingCard = await this.container.db.customCards.findFirst({
                where: {
                    name: data.name,
                    guildId: guild.id
                }
            });
            if (existingCard) {
                await this.container.db.customCards.update({
                    where: {
                        id: existingCard.id
                    },
                    data
                });
            } else {
                await this.container.db.customCards.create({
                    data: {
                        ...data,
                        imageUrl: match.imgExists[0],
                        guildId: guild.id
                    }
                });
            }
        }
    
    }
}

interface ICandidSearchResponse {
    qty: number;
    currPage: number;
    maxPages: number;
    matches: ICandidSearchMatches[]
}

interface ICandidSearchMatches {
    imgExists: string[];
    name: string;
    cardNumber: string;
    power: number;
    toughness: number;
    manaValue: number;
    rarity: number
    types: string[];
    subtypes: string[];
    supertypes: string[];
    manaCosts: string[];
    oracle: string[];
    colors: {
        white: boolean;
        blue: boolean;
        black: boolean;
        red: boolean;
        green: boolean;
    };
    colorIdentity: {
        white: boolean;
        blue: boolean;
        black: boolean;
        red: boolean;
        green: boolean;
    };
    altVersions: any[]; // TODO: Identify what this can be
    rulings: string[];
}

enum Rarity {
    LAND = 0,
    COMMON = 1,
    UNCOMMON = 2,
    RARE = 3,
    MYTHIC = 4,
    SPECIAL = 5
}