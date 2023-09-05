import {SnapCard} from 'root/models/snap_deck';
import {overlayConfig} from 'root/windows/overlay/overlay';

export function sortDeck(deck: SnapCard[], asc: boolean): SnapCard[] {
  deck.sort((a, b) => {
    const cardA = overlayConfig.allCards[a.CardDefId.toLowerCase()];
    const cardB = overlayConfig.allCards[b.CardDefId.toLowerCase()];
    if (cardA === undefined || cardB === undefined) {
      return asc ? a.CardDefId.localeCompare(b.CardDefId) : b.CardDefId.localeCompare(a.CardDefId);
    }
    return +cardA.cost === +cardB.cost
      ? +cardA.power === +cardB.power
        ? asc
          ? cardA.name.localeCompare(cardB.name)
          : cardB.name.localeCompare(cardA.name)
        : (asc ? +cardA.power : +cardB.power) - (asc ? +cardB.power : +cardA.power)
      : (asc ? +cardA.cost : +cardB.cost) - (asc ? +cardB.cost : +cardA.cost);
  });

  return deck;
}
