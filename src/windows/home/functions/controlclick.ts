import {showPrompt} from 'root/windows/home/functions/showPrompt';
import {currentCreds, HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function controlClick(event: Event): void {
  const cl: HTMLElement = event.target as HTMLElement;
  const button = cl.getAttribute('data-button') as string;
  switch (button) {
    case 'skip-acc':
      HomePageElements.TokenInput.classList.add('hidden');
      const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
      unhide.classList.remove('hidden');
      HomePageElements.StatusMessage.innerHTML = 'Skipping this account...';
      HomePageElements.UserControls.classList.remove('hidden');
      sendMessageToIpcMain('token-input', {
        token: `SKIPPING${Math.floor(1000 * Math.random())}`,
        uid: '',
        nick: 'Skipping',
        overlay: false,
        game: 'mtga',
      });
      break;
    case 'connect-acc':
      if (currentCreds.playerid === '' && currentCreds.plguid === '') {
        break;
      }
      cl.innerHTML = 'Awaiting...';
      sendMessageToIpcMain('start-sync', {
        playerid: currentCreds.playerid,
        plguid: currentCreds.plguid,
      });
      break;
    case 'lor-connect-acc':
      cl.innerHTML = 'Awaiting...';
      sendMessageToIpcMain('lor-start-sync', undefined);
      break;
    case 'unskip-acc':
      sendMessageToIpcMain('kill-current-token', undefined);
      break;
    case 'dev-log':
      sendMessageToIpcMain('dev-log', false);
      break;
    case 'dev-log-force':
      sendMessageToIpcMain('dev-log', true);
      break;
    case 'wipe-position':
    case 'wipe-all':
    case 'restart-me':
    case 'stop-tracker':
    case 'old-log':
    case 'apply-update':
    case 'default-log-path':
    case 'set-mtga-path':
    case 'default-mtga-path':
    case 'stop-shadow-sync':
      sendMessageToIpcMain(button, undefined);
      break;
    case 'set-log-path':
      if (currentCreds.currentLogState) {
        sendMessageToIpcMain(button, undefined);
      } else {
        // tslint:disable-next-line: no-magic-numbers
        showPrompt('Your log path is fine, no need to tinker with it ;)', 2000);
      }
      break;
  }
}
