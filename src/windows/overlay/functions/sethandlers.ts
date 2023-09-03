import {sendMessageToIpcMain} from 'root/windows/messages';
import {drawDeck} from 'root/windows/overlay/functions/drawdeck';
import {scalesetter} from 'root/windows/overlay/functions/setters';
import {updateOppDeck} from 'root/windows/overlay/functions/updateoppdeck';
import {currentMatch, overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export const opacityIncrement = 0.1;
export const scaleIncrement = 0.02;

const layoutHandler = () => {
  const layoutSteps = [6, 4, 3];
  const currentStep = layoutSteps.findIndex((e) => e === overlayConfig.cardsInARow);
  overlayConfig.cardsInARow = layoutSteps[currentStep === layoutSteps.length - 1 ? 0 : currentStep + 1];
  sendMessageToIpcMain('set-setting-o-cardsinarow', overlayConfig.cardsInARow);
  if (currentMatch.matchId !== '') {
    drawDeck();
    updateOppDeck([]);
  }
};

const handlerTransparencyHandle = () => {
  overlayConfig.currentOpacity += overlayConfig.dopplerOpacity;
  //console.log(currentOpacity);
  if (overlayConfig.currentOpacity.toFixed(1) === '0.5') {
    overlayConfig.dopplerOpacity = opacityIncrement;
  } else if (overlayConfig.currentOpacity.toFixed(1) === '1.0') {
    overlayConfig.dopplerOpacity = -1 * opacityIncrement;
  }
  overlayElements.MainDeckFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  overlayElements.OpponentOutFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  sendMessageToIpcMain('set-setting-o-opacity', overlayConfig.currentOpacity);
};

const handlerscaleIn = () => {
  overlayConfig.currentScale += scaleIncrement;
  scalesetter(true);
};

const handlerscaleOut = () => {
  overlayConfig.currentScale -= scaleIncrement;
  scalesetter(true);
};

export function SetHandlers(): void {
  window.onerror = function (error: string | Event, url: string | undefined, line: number | undefined): void {
    sendMessageToIpcMain('error-in-renderer', {error, url, line});
  };

  overlayElements.TableHandle.onclick = layoutHandler;
  overlayElements.TransparencyHandle.onclick = handlerTransparencyHandle;
  overlayElements.scaleIn.onclick = handlerscaleIn;
  overlayElements.scaleOut.onclick = handlerscaleOut;
}
