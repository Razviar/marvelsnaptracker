import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';

export interface SettingsV15 extends SettingsBase {
  version: Version.v15;
  accounts: AccountV12[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
  mtgaPath?: string;
  uploads?: boolean;
  nohotkeys?: boolean;
}

export interface AccountV12 {
  game: 'mtga' | 'lor';
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV9;
  hotkeysSettings?: HotkeysSettingsV2;
}

export interface HotkeysSettingsV2 {
  'hk-my-deck': string;
  'hk-opp-deck': string;
  'hk-overlay': string;
  'hk-inc-size': string;
  'hk-dec-size': string;
  'hk-inc-opac': string;
  'hk-dec-opac': string;
  'hk-restart-mtga': string;
}

export interface OverlaySettingsV9 {
  leftdigit: number;
  rightdigit: number;
  bottomdigit: number;
  rightdraftdigit: number;
  leftdraftdigit: number;
  hidemy: boolean;
  hideopp: boolean;
  hidezero: boolean;
  hidesuggestions: boolean;
  showcardicon: boolean;
  neverhide: boolean;
  mydecks: boolean;
  cardhover: boolean;
  timers: boolean;
  savepositiontop: number;
  savepositionleft: number;
  savepositiontopopp: number;
  savepositionleftopp: number;
  savescale: number;
  opacity: number;
  cardsinarow: number;
  fontcolor: number;
  detach: boolean;
  hidemain: boolean;
  interactive: boolean;
}
