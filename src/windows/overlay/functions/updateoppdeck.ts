import {SnapCard} from 'root/models/snap_deck';
import {CheckBottiness} from 'root/windows/overlay/functions/checkbot';
import {makeCard, makeCardBack} from 'root/windows/overlay/functions/makecard';
import {sortDeck} from 'root/windows/overlay/functions/sortdeck';
import {currentMatch, overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export function updateOppDeck(highlight: string[]): void {
  overlayElements.DeckNameOpp.innerHTML = `${CheckBottiness()}${
    currentMatch.oppDeckATSuggestion === '' ? '' : ` - ${currentMatch.oppDeckATSuggestion}`
  }`;

  let oppGraveyard: SnapCard[] = [];
  const oppDeckStrings: string[] = [];
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
  let alreadyOutputtedCards = 0;

  currentMatch.oppDeckStable = sortDeck(currentMatch.oppDeckStable, true);
  currentMatch.oppDeckStable.forEach((card) => {
    output += makeCard(card.CardDefId, false, card.RarityDefId, card.ArtVariantDefId);
    alreadyOutputtedCards++;
    oppDeckStrings.push(card.CardDefId);
  });

  if (Object.keys(currentMatch.oppDeckSuggestions).length === 0) {
    for (let unknownCard = 12 - currentMatch.oppDeckStable.length; unknownCard > 0; unknownCard--) {
      output += makeCardBack(currentMatch.oppCardBack, false);
    }
  } else {
    let n = 0;
    Object.keys(currentMatch.oppDeckSuggestions).forEach((cardDefIdSuggestion) => {
      if (oppDeckStrings.includes(cardDefIdSuggestion)) {
        n++;
      }
    });
    Object.keys(currentMatch.oppDeckSuggestions)
      .slice(0, 12 - currentMatch.oppDeckStable.length + n)
      .forEach((cardDefIdSuggestion) => {
        if (!oppDeckStrings.includes(cardDefIdSuggestion) && alreadyOutputtedCards < 12) {
          alreadyOutputtedCards++;
          output += makeCard(
            cardDefIdSuggestion,
            false,
            undefined,
            undefined,
            currentMatch.oppDeckSuggestions[cardDefIdSuggestion]
          );
        }
      });
  }

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
