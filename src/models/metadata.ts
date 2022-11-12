export interface UserMetadata {
  user: Userdata;
  collection: {[index: number]: {ic: number; ir: number; it: number}};
  usercapabilities: {[index: string]: boolean};
  coursedecks: {
    [index: string]: {
      udeck: string;
      humanname: string;
      deckstruct: {
        card: number;
        cardnum: number;
      }[];
    };
  };
}

export interface Userdata {
  user_id: number;
  lang: string;
  cardimagestype: number;
  pledge: number;
}
