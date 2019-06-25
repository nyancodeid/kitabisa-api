declare namespace KitaBisa {
  export interface Account {
    email: string,
    password: string
  }
  export interface Campaign {
    title: string,
    url: string,
    tumbnailUrl: string,
    campaigner: string,
    isOrganitaion: boolean,
    isVerified: boolean,
    dayLeft: number,
    total: number
  }
  export interface Balance {
    balance: number
  }
  export interface UserStat {
    donation: number,
    spend: number
  }
  export interface DonationOptions {
    url: string,
    amount: number,
    comment?: string,
    isAnonymous?: boolean,
    test?: boolean
  }
}