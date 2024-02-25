import Scry from "scryfall-sdk";

export async function getCardByName(name: string) {
    const card = await Scry.Cards.byName(name, true);
    // @ts-expect-error
    if (card.object == "error" && card.status == 404) {
        throw {
            // @ts-expect-error
            message: card.details,
            name: name,
            found: false
        }
    } else return card;
}