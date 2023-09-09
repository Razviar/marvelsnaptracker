import {SnapCard} from 'root/models/snap_deck';

export interface CardPlayedResult {
  affectedcards: string[];
  myDeck: boolean;
}

export interface CardPlayedNfo {
  cardDefId: string;
  rarityDefId: string;
  entityId: number;
  ownerEntityId: number;
  zoneId: number;
  artVariantDefId: string;
}

export interface ZoneEntity {
  type: 'deckEntity' | 'graveyardEntity' | 'handEntity' | 'locationEntity';
  owner: 'me' | 'opponent' | 'location';
  locationSlot?: number;
}

export class Match {
  public matchId: string = '';
  public ourUid: string = '';
  public zones: Record<number, ZoneEntity> = {};
  public cardEntityIDs: Record<number, CardPlayedNfo> = {};
  public myFullDeck: SnapCard[] = [];
  public humanname: string = '';
  public myEntityId: number = 0;
  public TurnNumber: number = 0;
  public GameNumber: number = 0;
  public timers: {me: number; opponent: number} = {me: 0, opponent: 0};
  public DecisionPlayer: number = 0;
  public totalCards: number = 0;
  public oppEntityId: number = 0;
  public oppDeckStable: SnapCard[] = [];
  public opponentNick: string = '';
  public oppCardBack: string = 'Snap_01';
  public oppDeckSuggestions: Record<string, string> = {};
  public oppDeckATSuggestion: string = '';

  public over(purgeOpp?: boolean): void {
    this.matchId = '';
    this.ourUid = '';
    this.zones = {};
    this.cardEntityIDs = {};
    this.myFullDeck = [];
    this.humanname = '';
    this.myEntityId = 0;
    this.oppEntityId = 0;
    this.TurnNumber = 0;
    this.GameNumber = 0;
    this.DecisionPlayer = 0;
    this.totalCards = 0;
    this.opponentNick = '';
    this.oppCardBack = 'Snap_01';
    this.oppDeckATSuggestion = '';
    this.timers = {me: 0, opponent: 0};
    if (purgeOpp) {
      this.oppDeckStable = [];
      this.oppDeckSuggestions = {};
    }
  }

  public switchTimer(decisionPlayer: number): void {
    this.DecisionPlayer = decisionPlayer;
  }

  public tick(): void {
    const timerOperation: 'me' | 'opponent' = this.DecisionPlayer !== this.myEntityId ? 'opponent' : 'me';
    this.timers[timerOperation]++;
  }
}
