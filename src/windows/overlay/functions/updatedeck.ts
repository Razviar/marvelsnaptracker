import {SnapCard} from 'root/models/snap_deck';
import {drawDeck} from 'root/windows/overlay/functions/drawdeck';
import {makeCard} from 'root/windows/overlay/functions/makecard';
import {sortDeck} from 'root/windows/overlay/functions/sortdeck';
import {currentMatch, overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export function updateDeck(highlight: string[]): void {
  let graveyard: SnapCard[] = [];
  const output = '';
  let graveyardString = '';
  try {
    Object.keys(currentMatch.cardEntityIDs).forEach((cardEntityID) => {
      const TheEntity = currentMatch.cardEntityIDs[+cardEntityID];
      if (
        +TheEntity.ownerEntityId === +currentMatch.myEntityId &&
        TheEntity.cardDefId !== '' &&
        currentMatch.zones?.[TheEntity.zoneId]?.type === 'graveyardEntity'
      ) {
        graveyard.push({
          CardDefId: TheEntity.cardDefId,
          RarityDefId: TheEntity.rarityDefId,
          ArtVariantDefId: TheEntity.artVariantDefId,
        });
      }
    });
  } catch (e) {
    console.log(e);
  }

  graveyard = sortDeck(graveyard, true);

  if (graveyard.length > 0) {
    drawDeck();

    graveyard.forEach((card) => {
      graveyardString += makeCard(card.CardDefId, true, card.RarityDefId, card.ArtVariantDefId);
    });

    overlayElements.MainOut.innerHTML +=
      '<div style="flex-basis:100%; text-align:center; padding:5px">Graveyard</div>' + graveyardString;
  }

  highlight.forEach((cardDefId) => {
    const crdEl: HTMLElement | null = document.getElementById(`card${cardDefId}me`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
      setTimeout(() => {
        crdEl.classList.remove('highlightCard');
        crdEl.classList.add(overlayConfig.ovlSettings && overlayConfig.ovlSettings.hidezero ? 'hidden' : 'outCard');
      }, overlayConfig.highlightTimeout);
    }
  });
}
