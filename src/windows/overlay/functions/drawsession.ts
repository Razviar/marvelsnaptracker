import {overlayConfig, overlayElements, playerDecks} from 'root/windows/overlay/overlay';

export function drawSession(
  statUpdate?: Record<
    string,
    {
      win: number;
      loss: number;
      cube_win: number;
      cube_loss: number;
    }
  >
): void {
  let output = '';

  const totals: {
    win: number;
    loss: number;
    cube_win: number;
    cube_loss: number;
  } = {
    win: 0,
    loss: 0,
    cube_win: 0,
    cube_loss: 0,
  };

  output += `<div class="DeckSummary">
      <div class="DeckSummaryEntity">
        <div class="DeckName">
          
        </div>
        <div class="DeckFact DeckWin">
         Win
        </div>
        <div class="DeckFact DeckLoss">
         Loss
        </div>
        <div class="DeckFact DeckWinrate">
          Win<br/>Rate
        </div>
        <div class="DeckFact DeckCubeWon">
          Cubes<br/>Won
        </div>
        <div class="DeckFact DeckCubeRatio">
          Cube<br/>Ratio
        </div>
      </div>
    </div>`;

  if (statUpdate) {
    playerDecks.forEach((playerDeck) => {
      if (statUpdate[playerDeck.id] === undefined) {
        return;
      }

      totals.win += statUpdate[playerDeck.id].win;
      totals.loss += statUpdate[playerDeck.id].loss;
      totals.cube_win += statUpdate[playerDeck.id].cube_win;
      totals.cube_loss += statUpdate[playerDeck.id].cube_loss;

      output += `<div class="DeckSummary">
      <div class="DeckSummaryEntity">
        <div class="DeckName">
          <strong>${playerDeck.name}</strong>
        </div>
        <div class="DeckFact DeckWin">
          ${statUpdate[playerDeck.id].win}
        </div>
        <div class="DeckFact DeckLoss">
          ${statUpdate[playerDeck.id].loss}
        </div>
        <div class="DeckFact DeckWinrate">
          ${(
            (100 * +statUpdate[playerDeck.id].win) /
            (+statUpdate[playerDeck.id].win + +statUpdate[playerDeck.id].loss)
          ).toFixed(1)}%
        </div>
        <div class="DeckFact DeckCubeWon">
          ${statUpdate[playerDeck.id].cube_win - statUpdate[playerDeck.id].cube_loss}
        </div>
        <div class="DeckFact DeckCubeRatio">
          ${(
            (statUpdate[playerDeck.id].cube_win - statUpdate[playerDeck.id].cube_loss) /
            (statUpdate[playerDeck.id].win + statUpdate[playerDeck.id].loss)
          ).toFixed(2)}
        </div>
      </div>
    </div>`;
    });
  } else {
    output += '<div class="statsPlaceholder">Play some matches to see session stats here!</div>';
  }

  output += `<div class="DeckSummary">
      <div class="DeckSummaryEntity">
        <div class="DeckName">
          <strong>TOTAL</strong>
        </div>
        <div class="DeckFact DeckWin">
          ${totals.win}
        </div>
        <div class="DeckFact DeckLoss">
          ${totals.loss}
        </div>
        <div class="DeckFact DeckWinrate">
          ${statUpdate ? ((100 * +totals.win) / (+totals.win + +totals.loss)).toFixed(1) : '??'}%
        </div>
        <div class="DeckFact DeckCubeWon">
          ${totals.cube_win - totals.cube_loss}
        </div>
        <div class="DeckFact DeckCubeRatio">
          ${statUpdate ? ((totals.cube_win - totals.cube_loss) / (totals.win + totals.loss)).toFixed(2) : '??'}
        </div>
      </div>
    </div>`;

  overlayElements.DeckName.innerHTML = 'Current Session Stats';
  overlayElements.MainOut.innerHTML = output;

  overlayElements.MainDeckFrame.classList.remove('hidden');
  //toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));

  /*const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach((theCard) => {
    HoverEventListener(theCard);
  });*/
}
