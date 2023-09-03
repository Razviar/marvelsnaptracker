import {overlayConfig} from 'root/windows/overlay/overlay';

export function makeCard(cardDefId: string, side: boolean, rarity?: string, variant?: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1; // Months start at 0!
  const dd = today.getDate();
  const formattedToday = dd + '-' + mm + '-' + yyyy;
  const cardWidth = 480 / overlayConfig.cardsInARow;
  const cardHeight = cardWidth * 1.3;

  return `
    <div class="DcDrow CardMainWrapper" data-cid="${cardDefId}" data-side="${
      side ? 'me' : 'opp'
    }" id="card${cardDefId}${side ? 'me' : 'opp'}" style="width: ${cardWidth}px; height:${cardHeight}px;">
      <div class="CardPicRenderer" style="width: ${cardWidth}px; height:${cardHeight}px; background-image: url('https://static.marvelsnap.pro/cards/${
        variant !== undefined && variant !== '' ? variant : cardDefId
      }${
        rarity && rarity != '' && rarity !== 'Common' ? `-${rarity.toLowerCase()}` : ''
      }.webp?anticache=${formattedToday}')"></div>
    </div>
`;
}
