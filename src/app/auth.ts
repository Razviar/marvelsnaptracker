import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';

export function setCreds(source: string): void {
  console.log('setCreds', source);
  const account = settingsStore.getAccount();
  //console.log(account);
  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
    settingsStore.save();
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
