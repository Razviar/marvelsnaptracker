import {currentMatch, overlayConfig} from 'root/windows/overlay/overlay';

export function CheckBottiness(): string {
  const nick = currentMatch.opponentNick;
  let botLikness = 0;
  let LSTM = false;

  overlayConfig.allBots.HiddenAiHumanNames.forEach((nameToTest) => {
    if (nick === nameToTest && nameToTest.length > 2) {
      botLikness += 5;
    }
  });

  overlayConfig.allBots.HiddenAiLSTMNames.forEach((nameToTest) => {
    if (nick === nameToTest && nameToTest.length > 2) {
      LSTM = true;
    }
  });

  overlayConfig.allBots.HiddenAiMarvelNames.forEach((nameToTest) => {
    if (nick === nameToTest && nameToTest.length > 2) {
      botLikness += 5;
    }
  });

  overlayConfig.allBots.HiddenAiRealPlayerNames.forEach((nameToTest) => {
    if (nick === nameToTest && nameToTest.length > 2) {
      botLikness += 5;
    }
  });

  return `${nick} (${LSTM ? 'LSTM Bot' : botLikness === 0 ? 'Human' : 'Possibly a Bot'})`;
}
