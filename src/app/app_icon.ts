import {settingsStore} from 'root/app/settings-store/settings_store';
import {asMap, asString} from 'root/lib/type_utils';

// tslint:disable-next-line:no-any
function loadAppIconInternal(type: string | undefined): any {
  // tslint:disable:no-require-imports
  if (type === undefined) {
    type = '';
  }

  return require(`root/statics/icon.ico`);
  // tslint:enable:no-require-imports
}

export function loadAppIcon(type: string | undefined): string {
  return asString(asMap(loadAppIconInternal(type), {}).default, '');
}

let appIcon: string | undefined;

export function getAppIcon(): string {
  if (appIcon === undefined) {
    appIcon = loadAppIcon(settingsStore.get().icon);
  }
  return appIcon;
}
