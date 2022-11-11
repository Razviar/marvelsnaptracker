import {sendMessageToIpcMain} from 'root/windows/messages';

export function settingsChecker(event: Event): void {
  const cl: HTMLInputElement = event.target as HTMLInputElement;
  const setting = cl.getAttribute('data-setting');
  switch (setting) {
    case 'autorun':
      sendMessageToIpcMain('set-setting-autorun', cl.checked);
      break;
    case 'minimized':
      sendMessageToIpcMain('set-setting-minimized', cl.checked);
      break;
    case 'manualupdate':
      sendMessageToIpcMain('set-setting-manualupdate', cl.checked);
      break;
    case 'overlay':
      sendMessageToIpcMain('set-setting-overlay', cl.checked);
      break;
    case 'do-uploads':
      sendMessageToIpcMain('set-setting-do-uploads', cl.checked);
      break;
    case 'icon':
      sendMessageToIpcMain('set-setting-icon', cl.value);
      break;
  }
}
