import {makeCard} from 'root/windows/overlay/functions/makecard';
import {currentMatch, overlayConfig, overlayElements, toggleButtonClass} from 'root/windows/overlay/overlay';

export function drawDeck(): void {
  let output = '';
  currentMatch.totalCards = 0;
  currentMatch.myFullDeck.forEach((card) => {
    output += makeCard(card.CardDefId, true, card.RarityDefId, card.ArtVariantDefId);
  });

  output += `<div class="deckBottom${
    overlayConfig.ovlSettings?.fontcolor === 2
      ? ' White'
      : overlayConfig.ovlSettings?.fontcolor === 1
      ? ' LightGrey'
      : ' DarkGrey'
  }">`;

  output += '</div>';
  overlayElements.DeckName.classList.add(
    overlayConfig.ovlSettings?.fontcolor === 2
      ? 'White'
      : overlayConfig.ovlSettings?.fontcolor === 1
      ? 'LightGrey'
      : 'DarkGrey'
  );
  overlayElements.DeckName.innerHTML = currentMatch.humanname;
  overlayElements.MainOut.innerHTML = output;
  if (!overlayConfig.ovlSettings?.hidemy) {
    overlayElements.MainDeckFrame.classList.remove('hidden');
    //toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
  }
  /*const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach((theCard) => {
    HoverEventListener(theCard);
  });*/
}
