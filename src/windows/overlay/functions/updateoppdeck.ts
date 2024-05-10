import {SnapCard} from 'root/models/snap_deck';
import {CheckBottiness} from 'root/windows/overlay/functions/checkbot';
import {HoverEventListener} from 'root/windows/overlay/functions/hovereventlistener';
import {makeCard, makeCardBack} from 'root/windows/overlay/functions/makecard';
import {sortDeck} from 'root/windows/overlay/functions/sortdeck';
import {currentMatch, overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export function updateOppDeck(highlight: string[]): void {
  overlayElements.DeckNameOpp.innerHTML = `${CheckBottiness()}${
    currentMatch.oppDeckATSuggestion === '' ? '' : ` - ${currentMatch.oppDeckATSuggestion}`
  }`;

  let oppGraveyard: SnapCard[] = [];
  const oppDeckStrings: string[] = [];

  let nOppCardHand = 0;
  let nOppCardDeck = 0;

  let thanosIndex = currentMatch.oppDeckStable.findIndex((el) => el.CardDefId === 'Thanos');
  let isThanosDeck = thanosIndex !== -1;
  let NCardsInDeck = isThanosDeck ? 18 : 12;

  if (currentMatch.oppDeckStable.length > NCardsInDeck) {
    currentMatch.oppDeckStable.length = 0;
  }

  Object.keys(currentMatch.cardEntityIDs).forEach((cardEntityID) => {
    const TheEntity = currentMatch.cardEntityIDs[+cardEntityID];
    const CardIndexInStableDeck = currentMatch.oppDeckStable.findIndex((el) => el.CardDefId === TheEntity.cardDefId);

    if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      TheEntity.cardDefId !== '' &&
      CardIndexInStableDeck === -1 &&
      currentMatch.oppDeckStable.length <= NCardsInDeck
    ) {
      currentMatch.oppDeckStable.push({
        CardDefId: TheEntity.cardDefId,
        RarityDefId: TheEntity.rarityDefId,
        ArtVariantDefId: TheEntity.artVariantDefId,
      });
    } else if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      TheEntity.cardDefId !== '' &&
      CardIndexInStableDeck !== -1
    ) {
      currentMatch.oppDeckStable[CardIndexInStableDeck].RarityDefId = TheEntity.rarityDefId;
      currentMatch.oppDeckStable[CardIndexInStableDeck].ArtVariantDefId = TheEntity.artVariantDefId;
    }

    if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      currentMatch.zones?.[TheEntity.zoneId]?.type === 'handEntity'
    ) {
      nOppCardHand++;
    } else if (
      +TheEntity.ownerEntityId === +currentMatch.oppEntityId &&
      currentMatch.zones?.[TheEntity.zoneId]?.type === 'deckEntity'
    ) {
      nOppCardDeck++;
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

  /*console.log(currentMatch.oppDeckStable);
  console.log(currentMatch.TurnNumber, nOppCardHand, nOppCardDeck, isThanosDeck, NCardsInDeck);*/

  if (currentMatch.oppDeckStable.length === 0 && currentMatch.TurnNumber == 0 && nOppCardHand === 5) {
    currentMatch.oppDeckStable.push({
      CardDefId: 'AgathaHarkness',
      RarityDefId: '',
      ArtVariantDefId: '',
    });
  }

  if (currentMatch.oppDeckStable.length === 0 && currentMatch.TurnNumber == 0 && nOppCardDeck === 18) {
    currentMatch.oppDeckStable.push(
      {
        CardDefId: 'Thanos',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'SpaceStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'RealityStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'TimeStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'MindStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'PowerStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      },
      {
        CardDefId: 'SoulStone',
        RarityDefId: '',
        ArtVariantDefId: '',
      }
    );
    NCardsInDeck = 18;
  }

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
    for (let unknownCard = NCardsInDeck - currentMatch.oppDeckStable.length; unknownCard > 0; unknownCard--) {
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
      .slice(0, NCardsInDeck - currentMatch.oppDeckStable.length + n)
      .forEach((cardDefIdSuggestion) => {
        if (!oppDeckStrings.includes(cardDefIdSuggestion) && alreadyOutputtedCards < NCardsInDeck) {
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

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach((theCard) => {
    HoverEventListener(theCard);
  });
}
