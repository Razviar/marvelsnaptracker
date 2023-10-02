import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export const HoverEventListener = (theCard: Element) => {
  //console.log(theCard);
  if (!overlayConfig.allCards) {
    return;
  }
  const cardsdb = overlayConfig.allCards;
  if (theCard.getAttribute('listener') !== 'true') {
    theCard.addEventListener('mouseenter', (event: Event) => {
      const cl: HTMLElement = event.target as HTMLElement;
      const cid = cl.getAttribute('data-cid') as string;
      const side = cl.getAttribute('data-side') as string;
      const Card = cardsdb[cid.toLowerCase()];
      //console.log(cid);

      if (Card === undefined) {
        return;
      }
      if (side === 'me') {
        overlayElements.CardHint.innerHTML = `<strong>${Card.name}</strong>. ${Card.description}`;
      } else {
        overlayElements.CardHintOpp.innerHTML = `<strong>${Card.name}</strong>. ${Card.description}`;
      }
    });

    theCard.addEventListener('mouseleave', (event: Event) => {
      const cl: HTMLElement = event.target as HTMLElement;
      const side = cl.getAttribute('data-side') as string;

      if (side === 'opp') {
        overlayElements.CardHint.innerHTML = `Hover over the card to see it's details`;
      } else {
        overlayElements.CardHintOpp.innerHTML = `Hover over the card to see it's details`;
      }
    });

    theCard.setAttribute('listener', 'true');
  }
};
