export interface Indicators {
  marker: number;
  Indicators: string;
  Send: string;
  Needrunning: string;
  Addup: string;
  Stopper: string;
  Needtohave: string;
  Ignore: string;
}

export interface ParseResults {
  time: number;
  indicator: string;
  json: string;
  uid: string;
}
