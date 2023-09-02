export function makeCard(cardDefId: string, side: boolean, rarity?: string, variant?: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1; // Months start at 0!
  const dd = today.getDate();
  const formattedToday = dd + '-' + mm + '-' + yyyy;
  return `
    <div class="DcDrow CardMainWrapper" data-cid="${cardDefId}" data-side="${
      side ? 'me' : 'opp'
    }" id="card${cardDefId}${side ? 'me' : 'opp'}" style="width: 80px; height:104px;">
      <div class="CardPicRenderer" style="width: 80px; height:104px; background-image: url('https://static.marvelsnap.pro/cards/${
        variant !== undefined && variant !== '' ? variant : cardDefId
      }${
        rarity && rarity != '' && rarity !== 'Common' ? `-${rarity.toLowerCase()}` : ''
      }.webp?anticache=${formattedToday}')"></div>
    </div>
`;
}
