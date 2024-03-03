// Original JS taken from Scryfalls open source discord bot on Github
// Converted to TS & @sapphire/framework by @devramsean0

import { container } from "@sapphire/framework";

interface Substitutions {
    [key: string]: string;
}

const substitutions: Substitutions = {
    'CHAOS': 'manachaos',
    '{∞}': 'manainfinity',
    '{½}': 'manahalf',
    '{hr}': 'manahr'
};  

const COLORS: string[] = ['W', 'U', 'B', 'R', 'G'];
const NUMBERS: any[] = [...Array(21).keys()];
const ADDTL: string[] = ['C', 'E', 'HR', 'HW', 'T', 'Q', 'S', 'X', 'Y', 'Z'];

function _(before: any, after?: any): void {
    if (typeof after === 'undefined') {
        after = before;
    }
    substitutions[`{${before}}`] = `mana${after.toString().toLowerCase()}`;
}

ADDTL.forEach(a => { _(a) });
COLORS.forEach(c => { _(c) });
COLORS.forEach(c => { _(`2/${c}`, `2${c}`) });
COLORS.forEach(c => { _(`${c}/P`, `${c}p`) });
COLORS.forEach(c => { COLORS.forEach(d => {
    if (c !== d) _(c + '/' + d, c + d);
}) });
NUMBERS.forEach(n => { 
    _(n) });

export function manamoji(str: string): string {
        const re = new RegExp(Object.keys(substitutions).map(v => {
            return v.replace('{', '\\{').replace('}', '\\}');
        }).join('|'), 'gi');
        return str.replace(re, matched => {
            const emoji = container.client.emojis.cache.find((emoji: any) => emoji.name === substitutions[matched]);
            return emoji ? emoji.toString() : matched;
        });
    }