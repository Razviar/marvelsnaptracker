import {OverlaySettings} from 'root/app/settings-store/settings_store';
import {Bots} from 'root/models/bots';
import {Cards} from 'root/models/cards';

export interface OverlayConfig {
  ovlSettings: OverlaySettings | undefined;
  allCards: Cards;
  allBots: Bots;
  selectedDeck: string;
  currentScale: number;
  currentOpacity: number;
  dopplerOpacity: number;
  cardsInARow: number;
  justcreated: boolean;
  icon: string;
  highlightTimeout: number;
  timer?: NodeJS.Timeout;
}
