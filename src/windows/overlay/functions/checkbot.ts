import {currentMatch, overlayConfig} from 'root/windows/overlay/overlay';

export function CheckBottiness(): string {
  let nick = currentMatch.opponentNick;
  let botLikness = 0;

  overlayConfig.allBots.HiddenAiHumanNames.forEach((nameToTest) => {
    if (nick === nameToTest) {
      botLikness += 5;
    }
  });

  overlayConfig.allBots.HiddenAiLSTMNames.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
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

  overlayConfig.allBots.HiddenAiRealPlayerNames.forEach((nameToTest) => {
    if (nick.includes(nameToTest) && nameToTest.length > 3) {
      botLikness++;
    }
  });

  return `${nick} (${botLikness === 0 ? 'Human' : botLikness > 1 ? 'Most Likely A Bot' : 'Could Be a Bot'})`;
}
