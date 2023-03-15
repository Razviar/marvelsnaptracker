export type SnapCard = {CardDefId: string; RarityDefId: string; ArtVariantDefId: string};

export type DeckCardArray = Array<SnapCard>;

export interface UserDeck {
  name: string;
  cards: DeckCardArray;
  id: string;
}
