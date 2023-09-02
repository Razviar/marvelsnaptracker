export interface Card {
  CardDefId: string;
  name: string;
  description: string;
  abilities: string;
  cost: string;
  power: string;
  category: string;
  source: string;
  variants: Variant[];
  use_count: string;
  connected_cards: string;
  is_Token: string;
  share_cube_earned: number;
  share_cube_lost: number;
  share_cube_won: number;
  share_loss: number;
  share_total: number;
  share_win: number;
  stats_cuberate: number;
  stats_winrate: number;
  collectible: string;
  stats_cube_lost: string;
  stats_cube_won: string;
  stats_loss: string;
  stats_win: string;
  stats_position: string;
  PrimaryColor: string;
  RingColor: string;
  SecondaryColor: string;
  stats_winrate_played: string;
  stats_cuberate_played: string;
  CardSeriesDefId: string;
  SeriesStartDates: string;
}

export interface Variant {
  id: string;
  source: string;
  category: string;
  credits?: string;
  released?: string;
  possession?: string | null;
  usage_count?: string | null;
  ReleaseDate?: string;
  wasAddedIn?: string;
}

export type Cards = Record<string, Card>;

export interface Location {
  CardDefId: string;
  abilities: string;
  description: string;
  difficulty: string;
  name: string;
  rarity: string;
  tip: string;
  released: string;
}

export type Locations = Record<string, Location>;

export type VariantFiltersStrings = 'status' | 'srt' | 'direct' | 'rarity' | 'category' | 'smrtsrhc' | 'clearfilters';

export type CardFiltersStrings =
  | 'cost'
  | 'power'
  | 'pool'
  | 'srt'
  | 'direct'
  | 'smrtsrhc'
  | 'clearfilters'
  | 'usecount'
  | 'collection'
  | 'dataToShow'
  | 'releaseStatus'
  | 'tokenStatus';

export type LocationFiltersStrings = 'smrtsrhc' | 'released' | 'rarity' | 'difficulty' | 'clearfilters';

export interface CardBack {
  CardBackDefId: string;
  Name: string;
  Enabled: string;
  source: string;
}
