import {currentMatch, overlayConfig} from 'root/windows/overlay/overlay';

export function makeCard(cardDefId: string, side: boolean, rarity?: string, variant?: string): string {
  return `
    <div class="DcDrow CardMainWrapper" data-cid="${cardDefId}" data-side="${
    side ? 'me' : 'opp'
  }" id="card${cardDefId}${side ? 'me' : 'opp'}" style="width: 80px; height:104px;">
      <div class="CardPicRenderer" style="width: 80px; height:104px; background-image: url('https://static.marvelsnap.pro/cards/${
        variant !== undefined && variant !== '' ? variant : cardDefId
      }${rarity && rarity != '' && rarity !== 'Common' ? `-${rarity.toLowerCase()}` : ''}.webp')"></div>
    </div>
`;
}
