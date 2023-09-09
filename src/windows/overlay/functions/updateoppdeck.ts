import {SnapCard} from 'root/models/snap_deck';
import {CheckBottiness} from 'root/windows/overlay/functions/checkbot';
import {makeCard} from 'root/windows/overlay/functions/makecard';
import {sortDeck} from 'root/windows/overlay/functions/sortdeck';
import {currentMatch, overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export function updateOppDeck(highlight: string[]): void {
  overlayElements.DeckNameOpp.innerHTML = CheckBottiness();

  let oppGraveyard: SnapCard[] = [];
  if (currentMatch.oppDeckStable.length > 12) {
    currentMatch.oppDeckStable.length = 0;
  }
  Object.keys(currentMatch.cardEntityIDs).forEach((cardEntityID) => {
    const TheEntity = currentMatch.cardEntityIDs[+cardEntityID];
    if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      TheEntity.cardDefId !== '' &&
      currentMatch.oppDeckStable.findIndex((el) => el.CardDefId === TheEntity.cardDefId) === -1 &&
      currentMatch.oppDeckStable.length <= 12
    ) {
      currentMatch.oppDeckStable.push({
        CardDefId: TheEntity.cardDefId,
        RarityDefId: TheEntity.rarityDefId,
        ArtVariantDefId: TheEntity.artVariantDefId,
      });
    }

    if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      TheEntity.cardDefId !== '' &&
      currentMatch.zones?.[TheEntity.zoneId]?.type === 'graveyardEntity'
    ) {
      oppGraveyard.push({
        CardDefId: TheEntity.cardDefId,
        RarityDefId: TheEntity.rarityDefId,
        ArtVariantDefId: TheEntity.artVariantDefId,
      });
    }
  });

  let output = '';
  let outputGrave = '';

  currentMatch.oppDeckStable = sortDeck(currentMatch.oppDeckStable, true);

  currentMatch.oppDeckStable.forEach((card) => {
    output += makeCard(card.CardDefId, false, card.RarityDefId, card.ArtVariantDefId);
  });

  oppGraveyard = sortDeck(oppGraveyard, true);

  oppGraveyard.forEach((card) => {
    outputGrave += makeCard(card.CardDefId, false, card.RarityDefId, card.ArtVariantDefId);
  });

  overlayElements.OpponentOut.innerHTML =
    output +
    (outputGrave !== ''
      ? '<div style="flex-basis:100%; text-align:center; padding:5px">Graveyard</div>' + outputGrave
      : '');

  if (!overlayConfig.ovlSettings?.hideopp) {
    overlayElements.OpponentOutFrame.classList.remove('hidden');
    //toggleButtonClass(overlayElements.ToggleOpp, overlayElements.OpponentOutFrame.classList.contains('hidden'));
  }

  highlight.forEach((mtgaid) => {
    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}opp`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
    }
  });

  setTimeout(() => {
    Array.from(document.getElementsByClassName('highlightCard')).forEach((el) => {
      el.classList.remove('highlightCard');
    });
  }, overlayConfig.highlightTimeout);

  /* const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach((theCard) => {
    HoverEventListener(theCard);
  });*/
}
