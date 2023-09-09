import {Message} from 'root/lib/messages';
import {hasOwnProperty} from 'root/lib/type_utils';
import {login} from 'root/windows/home/functions/login';
import {showPrompt} from 'root/windows/home/functions/showPrompt';
import {tokenWaiter} from 'root/windows/home/functions/tokenWaiter';
import {updatelinks} from 'root/windows/home/functions/updatelinks';
import {currentCreds, HomePageElements} from 'root/windows/home/home';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';

export function installHomeMessages(): void {
  onMessageFromIpcMain('set-screenname', (data) => {
    HomePageElements.UserCredentials.innerHTML = `<div class="stringTitle">SNAP nick:</div><strong>${data.screenName}</strong>`;
    currentCreds.playerid = data.screenName;
    currentCreds.plguid = data.newPlayerId;
  });

  onMessageFromIpcMain('set-hotkey-map', (hkMap) => {
    if (hkMap === undefined) {
      return;
    }
    Object.keys(hkMap).forEach((key) => {
      try {
        const btn = key as
          | 'hk-my-deck'
          | 'hk-opp-deck'
          | 'hk-overlay'
          | 'hk-inc-size'
          | 'hk-dec-size'
          | 'hk-inc-opac'
          | 'hk-dec-opac';
        const sw = document.querySelector(`[data-hk="${key}"]`) as HTMLSelectElement;
        sw.innerHTML = hkMap[btn].toUpperCase();
      } catch (e) {}
    });
  });

  onMessageFromIpcMain('set-creds', (creds) => {
    const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;

    //activateGame('mtga');
    if (creds.account.nick !== 'Skipping') {
      //console.log('doing LOGIN!');
      login(creds.account.token, creds.account.uid, creds.account.nick, 'set-creds');
      unhide.classList.add('hidden');
    } else {
      if (creds.account.player !== undefined) {
        currentCreds.playerid = creds.account.player.screenName;
        currentCreds.plguid = creds.account.player.playerId;
        HomePageElements.UserCredentials.innerHTML = `<div class="stringTitle">SNAP nick:</div><strong>${creds.account.player?.screenName}</strong>`;
        HomePageElements.TokenResponse.innerHTML = `<div class="stringTitle">Current user:</div><strong>Skipping this account...</strong>`;
        HomePageElements.StatusMessage.innerHTML = '';
        HomePageElements.UserControls.classList.remove('hidden');
        unhide.classList.remove('hidden');
      }
    }
  });

  onMessageFromIpcMain('set-settings', (newSettings) => {
    let output = `<div class="table"><div class='row'>
          <div class='cell header white'><strong>Nick</strong></div>
          <div class='cell header white'><strong>SNAP nick</strong></div>
          <div class='cell header white'><strong>SNAP ID</strong></div>
          <div class='cell header white'><strong>SNAP.Pro User ID</strong></div>
          </div>`;
    newSettings.accounts.forEach((account) => {
      output += `<div class='row'>
            <div class='cell'><strong class="white">${account.nick}</strong></div>
            <div class='cell'>${account.player ? account.player.screenName : ''}</div>
            <div class='cell'>${account.player ? account.player.playerId : ''}</div>
            <div class='cell'>${account.uid}</div>
            </div>`;
    });
    output += '</div>';
    HomePageElements.AccountsTab.innerHTML = output;
    updatelinks();

    if (newSettings.overlay) {
      const sw = document.querySelector('[data-setting="overlay"]') as HTMLInputElement;
      sw.checked = newSettings.overlay;
    }

    if (newSettings.autorun) {
      const sw = document.querySelector('[data-setting="autorun"]') as HTMLInputElement;
      sw.checked = newSettings.autorun;
    }

    if (newSettings.minimized) {
      const sw = document.querySelector('[data-setting="minimized"]') as HTMLInputElement;
      sw.checked = newSettings.minimized;
    }

    if (newSettings.manualUpdate) {
      const sw = document.querySelector('[data-setting="manualupdate"]') as HTMLInputElement;
      sw.checked = newSettings.manualUpdate;
    }

    if (newSettings.nohotkeys !== undefined) {
      const sw = document.querySelector('[data-setting="disable-hotkeys"]') as HTMLInputElement;
      if (sw) {
        sw.checked = newSettings.nohotkeys;
        if (!newSettings.nohotkeys) {
          HomePageElements.hotkeyMap.classList.remove('hidden');
        } else {
          HomePageElements.hotkeyMap.classList.add('hidden');
        }
      }
    }

    if (newSettings.logPath !== undefined) {
      const sw = document.getElementById('CurrentLogPath') as HTMLElement;
      sw.innerHTML = `<strong>${newSettings.logPath}</strong>`;
    } else {
      const sw = document.getElementById('CurrentLogPath') as HTMLElement;
      sw.innerHTML = '<strong>Default</strong>';
    }

    if (newSettings.icon !== undefined) {
      const sw = document.querySelector('[data-setting="icon"]') as HTMLSelectElement;
      const opts = sw.options;
      sw.selectedIndex = Array.from(opts).findIndex((opt) => opt.value === newSettings.icon);
    }
  });

  onMessageFromIpcMain('set-o-settings', (newOSettings) => {
    const overlaySettingsBoolean: Message[] = [
      'set-setting-o-hidezero',
      'set-setting-o-hidemy',
      'set-setting-o-hideopp',
      'set-setting-o-neverhide',
      'set-setting-o-hidesuggestions',
    ];

    overlaySettingsBoolean.forEach((settingName) => {
      const settingType = settingName.split('set-setting-o-')[1] ?? '';
      const sw = document.querySelector(`[data-setting="o-${settingType}"]`) as HTMLInputElement;
      if (sw && hasOwnProperty(newOSettings, settingType)) {
        const value = newOSettings[settingType];
        if (typeof value === 'boolean') {
          sw.checked = value;
        }
      }
    });
  });

  onMessageFromIpcMain('set-version', (version) => {
    HomePageElements.AppVersion.innerHTML = version;
  });

  onMessageFromIpcMain('show-status', (arg) => {
    if (HomePageElements.StatusMessage.innerHTML !== arg.message) {
      HomePageElements.StatusMessage.innerHTML = arg.message;
      HomePageElements.StatusMessage.style.color = arg.color;
    }
  });

  onMessageFromIpcMain('show-prompt', (arg) => {
    showPrompt(arg.message, arg.autoclose);
  });

  onMessageFromIpcMain('new-account', () => {
    const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
    unhide.classList.add('hidden');
    HomePageElements.StatusMessage.innerHTML = 'Awaiting account sync...';
    HomePageElements.TokenResponse.innerHTML = '';
    HomePageElements.TokenInput.classList.remove('hidden');
    HomePageElements.UserControls.classList.add('hidden');
  });

  onMessageFromIpcMain('show-update-button', () => {
    const sw = document.querySelector('[data-button="apply-update"]') as HTMLElement;
    sw.classList.remove('hidden');
  });

  onMessageFromIpcMain('sync-process', (res) => {
    if (res.mode === 'needauth') {
      sendMessageToIpcMain('open-link', `https://marvelsnap.pro//sync/?request=${res.request}`);
      HomePageElements.directSyncLink.innerHTML = `<div class="directSyncLink">https://marvelsnap.pro//sync/?request=${res.request}</div>`;
      tokenWaiter(res.request);
      currentCreds.numberOfSyncAttempts = 0;
    } else if (res.mode === 'hasauth') {
      login(res.token, res.uid, res.nick, 'connect-acc');
    }
  });

  onMessageFromIpcMain('token-waiter-responce', (response) => {
    console.log('token-waiter-responce', response);
    if (response.res && response.res.token && response.res.token !== '') {
      login(response.res.token, response.res.uid, response.res.nick);
    } else {
      const MaxWaitTime = 120;
      if (currentCreds.numberOfSyncAttempts <= MaxWaitTime) {
        currentCreds.numberOfSyncAttempts++;
        setTimeout(() => {
          tokenWaiter(response.request);
        }, 1000);
      }
    }
  });

  onMessageFromIpcMain('userbytokenid-responce', (res) => {
    if (res.status === 'UNSET_USER') {
      sendMessageToIpcMain('kill-current-token', undefined);
    }
  });

  onMessageFromIpcMain('shadow-sync-over', () => {
    const ShadowSyncStopper = document.querySelector('[data-button="stop-shadow-sync"]') as HTMLElement;
    ShadowSyncStopper.classList.add('hidden');
    const ShadowSyncStarter = document.querySelector('[data-button="do-shadow-sync"]') as HTMLElement;
    ShadowSyncStarter.classList.remove('hidden');
  });

  onMessageFromIpcMain('nologfile', () => {
    const unhide = document.querySelector('[data-button="set-log-path"]') as HTMLElement;
    unhide.classList.remove('disabled');
    currentCreds.currentLogState = true;
  });

  onMessageFromIpcMain('show-dev-buttons', () => {
    Array.from(document.getElementsByClassName('devButton')).forEach((el) => {
      el.classList.remove('hidden');
    });
  });

  onMessageFromIpcMain('startup-title', (title) => {
    HomePageElements.StartupTitle.innerHTML = title;
  });
}
