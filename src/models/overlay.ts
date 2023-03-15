import {OverlaySettings} from 'root/app/settings-store/settings_store';
import {Card} from 'root/models/cards';

export interface OverlayConfig {
  ovlSettings: OverlaySettings | undefined;
  allCards: Map<string, Card>;
  selectedDeck: string;
  currentScale: number;
  currentOpacity: number;
  dopplerOpacity: number;
  justcreated: boolean;
  icon: string;
  highlightTimeout: number;
  timer?: NodeJS.Timeout;
}
