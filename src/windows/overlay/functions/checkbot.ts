import {currentMatch, overlayConfig} from 'root/windows/overlay/overlay';

export function CheckBottiness(): string {
  const nick = currentMatch.opponentNick;
  let botLikness = 0;
  let LSTM = false;

  overlayConfig.allBots.HiddenAiHumanNames.forEach((nameToTest) => {
    if (nick === nameToTest) {
      botLikness += 5;
    }
  });

  overlayConfig.allBots.HiddenAiLSTMNames.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
    }
    if (nick === nameToTest) {
      LSTM = true;
    }
  });

  overlayConfig.allBots.HiddenAiMarvelNames.forEach((nameToTest) => {
    if (nick === nameToTest) {
      botLikness += 5;
    }
  });

  overlayConfig.allBots.HiddenAiNamePostfixes.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
    }
  });

  overlayConfig.allBots.HiddenAiNamePrefixes.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
    }
  });

  overlayConfig.allBots.HiddenAiRealPlayerNames.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
    }
  });

  return `${nick} (${
    LSTM ? 'LSTM Bot' : botLikness === 0 ? 'Human' : botLikness > 1 ? 'Definitely a Bot' : 'Possibly a Bot'
  })`;
}
