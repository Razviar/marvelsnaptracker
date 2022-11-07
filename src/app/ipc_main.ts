import {App, dialog, nativeImage, shell} from 'electron';
import {join} from 'path';

import {setuserdata, tokencheck, tokenrequest, userbytokenid, UserData} from 'root/api/userbytokenid';
import {loadAppIcon} from 'root/app/app_icon';
import {sendSettingsToRenderer} from 'root/app/auth';
import {disableAutoLauncher, enableAutoLauncher} from 'root/app/auto_launcher';
import {checkForUpdates, quitAndInstall} from 'root/app/auto_updater';
import {withLogParser} from 'root/app/log_parser_manager';
import {withHomeWindow} from 'root/app/main_window';
import {onMessageFromBrowserWindow, sendMessageToHomeWindow} from 'root/app/messages';
import {oldStore} from 'root/app/old_store';
import {permissionManager} from 'root/app/permission_manager';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {stateStore} from 'root/app/state_store';
import {error} from 'root/lib/logger';

export function setupIpcMain(app: App): void {
  onMessageFromBrowserWindow('token-input', (newAccount) => {
    const settings = settingsStore.get();
    const game: 'lor' | 'mtga' = newAccount.game;
    if (!settings.userToken || settings.userToken[game] !== newAccount.token) {
      if (settings.userToken === undefined) {
        settings.userToken = {};
      }
      settings.userToken[game] = newAccount.token;

      settingsStore.removeAccount(newAccount.token);
      settings.accounts.push(newAccount);

      const awaiting = settingsStore.get().awaiting;
      if (awaiting) {
        newAccount.player = awaiting;

        const userData: UserData = {
          snapId: awaiting.playerId,
          snapNick: awaiting.screenName,
          token: newAccount.token,
        };

        if (!newAccount.token.includes('SKIPPING')) {
          setuserdata(userData).catch((err) => {
            error('Failure to set user data after a token-input event', err, {...userData});
          });
        }

        settings.awaiting = undefined;
        withLogParser((logParser) => {
          logParser.start().catch((err) => {
            error('Failure to start log parser', err);
          });
        });
      }

      // Don't forget to save on disk ;)
      settingsStore.save();
    }
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('start-sync', (currentMtgaCreds) => {
    tokenrequest(currentMtgaCreds)
      .then((res) => {
        console.log(res);
        sendMessageToHomeWindow('sync-process', res);
      })
      .catch((err) => {
        error('Failure to perform tokenrequest', err, {currentMtgaCreds});
      });
  });

  onMessageFromBrowserWindow('token-waiter', (request) => {
    tokencheck(request)
      .then((res) => {
        sendMessageToHomeWindow('token-waiter-responce', {res, request});
      })
      .catch((err) => {
        error('Failure to perform tokencheck', err, {request}, true);
      });
  });

  onMessageFromBrowserWindow('get-userbytokenid', (token) => {
    userbytokenid(token)
      .then((res) => {
        sendMessageToHomeWindow('userbytokenid-responce', res);
      })
      .catch((err) => {
        error('Failure to perform userbytokenid', err, {token});
      });
  });

  onMessageFromBrowserWindow('minimize-me', () => withHomeWindow((w) => w.hide()));

  onMessageFromBrowserWindow('open-link', (link) => {
    shell.openExternal(link).catch((err) => {
      error('Failure to open link', err, {link});
    });
  });

  onMessageFromBrowserWindow('set-setting-autorun', (newAutorun) => {
    const settings = settingsStore.get();
    settings.autorun = newAutorun;
    settingsStore.save();

    if (newAutorun) {
      enableAutoLauncher();
    } else {
      disableAutoLauncher();
    }
  });

  onMessageFromBrowserWindow('set-setting-minimized', (newMinimized) => {
    const settings = settingsStore.get();
    settings.minimized = newMinimized;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-manualupdate', (newManualUpdate) => {
    const settings = settingsStore.get();
    settings.manualUpdate = newManualUpdate;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-overlay', (newOverlay) => {
    const settings = settingsStore.get();
    settings.overlay = newOverlay;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-do-uploads', (newUploads) => {
    const settings = settingsStore.get();
    settings.uploads = newUploads;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-disable-hotkeys', (newHotkeys) => {
    const settings = settingsStore.get();
    settings.nohotkeys = newHotkeys;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-icon', (newIcon) => {
    const settings = settingsStore.get();
    settings.icon = newIcon;
    settingsStore.save();

    withHomeWindow((w) => {
      const icon = loadAppIcon(newIcon);
      const newico = nativeImage.createFromPath(join(__dirname, icon));
      w.Tray.setImage(newico);
      w.setIcon(newico);
    });
  });

  /*HOTKEY SETTINGS BEGIN*/

  const hkSettings = [
    'hk-my-deck',
    'hk-opp-deck',
    'hk-overlay',
    'hk-inc-size',
    'hk-dec-size',
    'hk-inc-opac',
    'hk-dec-opac',
  ];

  hkSettings.forEach((settings) => {
    const set = settings as
      | 'hk-my-deck'
      | 'hk-opp-deck'
      | 'hk-overlay'
      | 'hk-inc-size'
      | 'hk-dec-size'
      | 'hk-inc-opac'
      | 'hk-dec-opac';
    onMessageFromBrowserWindow(set, (newHotkeyBinding) => {
      const session = settingsStore.getAccount();
      if (session === undefined) {
        return;
      }
      if (session.hotkeysSettings === undefined) {
        return;
      }
      session.hotkeysSettings[set] = newHotkeyBinding;
      settingsStore.save();
      sendMessageToHomeWindow('set-hotkey-map', session.hotkeysSettings);
    });
  });

  /*HOTKEY SETTINGS END*/

  onMessageFromBrowserWindow('kill-current-token', () => {
    const settings = settingsStore.get();
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }

    const player = session.player;
    if (!player) {
      return;
    }

    settings.awaiting = player;
    settings.userToken = undefined;
    settingsStore.removeAccount(session.token);

    settingsStore.save();

    withLogParser((logParser) => {
      logParser.stop();
      sendMessageToHomeWindow('new-account', undefined);
    });

    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('set-log-path', () => {
    dialog
      .showOpenDialog({properties: ['openFile'], filters: [{name: 'Player', extensions: ['log']}]})
      .then((log) => {
        if (!log.canceled && log.filePaths[0]) {
          settingsStore.get().logPath = log.filePaths[0];
          settingsStore.save();
          sendMessageToHomeWindow('show-prompt', {message: 'Log path have been updated!', autoclose: 1000});
          sendSettingsToRenderer();
        }
      })
      .catch((err) => error('Error while showing open file dialog during set-log-path event', err));
  });

  onMessageFromBrowserWindow('default-log-path', () => {
    settingsStore.get().logPath = undefined;
    settingsStore.save();
    sendMessageToHomeWindow('show-prompt', {message: 'Log path have been set to default!', autoclose: 1000});
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('restart-me', () => {
    sendMessageToHomeWindow('show-prompt', {
      message: 'Restarting tracker...',
      autoclose: 0,
    });
    app.relaunch();
    app.exit();
  });

  onMessageFromBrowserWindow('wipe-all', () => {
    settingsStore.wipe();
    stateStore.wipe();
    oldStore.wipe();
    sendMessageToHomeWindow('show-prompt', {
      message: 'All settings have been wiped',
      autoclose: 1000,
    });
    app.relaunch();
    app.exit();
  });

  onMessageFromBrowserWindow('check-updates', () => {
    checkForUpdates();
  });

  onMessageFromBrowserWindow('stop-tracker', () => {
    app.quit();
  });

  onMessageFromBrowserWindow('apply-update', () => {
    quitAndInstall();
  });

  onMessageFromBrowserWindow('enable-screen-recording', () => {
    permissionManager.requireScreenRecording();
  });
}
