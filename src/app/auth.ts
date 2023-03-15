import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {DefaultOvlSettings} from 'root/lib/utils';

export function setCreds(source: string): void {
  //console.log('setCreds', source);
  const account = settingsStore.getAccount();
  //console.log(account);
  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
    if (!account.hotkeysSettings) {
      account.hotkeysSettings = {
        'hk-my-deck': 'Q',
        'hk-opp-deck': 'W',
        'hk-overlay': '`',
        'hk-inc-size': 'A',
        'hk-dec-size': 'S',
        'hk-inc-opac': 'E',
        'hk-dec-opac': 'D',
        'hk-restart-mtga': 'R',
      };
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-hotkey-map', account.hotkeysSettings);
    if (!account.overlaySettings) {
      account.overlay = true;
      account.overlaySettings = DefaultOvlSettings;
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-o-settings', account.overlaySettings);
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
