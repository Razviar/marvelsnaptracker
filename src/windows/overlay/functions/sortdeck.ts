import {SnapCard} from 'root/models/snap_deck';
import {overlayConfig} from 'root/windows/overlay/overlay';

export function sortDeck(deck: SnapCard[], asc: boolean): SnapCard[] {
  deck.sort((a, b) => {
    const cardA = overlayConfig.allCards[a.CardDefId.toLowerCase()];
    const cardB = overlayConfig.allCards[b.CardDefId.toLowerCase()];
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
