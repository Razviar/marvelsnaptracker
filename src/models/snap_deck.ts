export interface SnapCard {CardDefId: string; RarityDefId: string; ArtVariantDefId: string}

export type DeckCardArray = SnapCard[];

export interface UserDeck {
  name: string;
  cards: DeckCardArray;
  id: string;
}
