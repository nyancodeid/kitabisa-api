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
export interface UserStatistic {
  spend: number
}
export interface SignInResult {
  success: boolean,
  hash?: string
}
export interface DonationOptions {
  url: string,
  amount: number,
  evidence?: boolean,
  comment?: string,
  isAnonymous?: boolean,
  test?: boolean
}
export interface Progress {
  bar: number,
  style: string,
}
export interface LabelProperty {
  style: string,
  text: string,
}
export interface CampaignJSON {
  id: number;
  title: string;
  expired: number;
  image: string;
  days_remaining: number;
  donation_received: number;
  campaigner: string;
  campaigner_type: string;
  campaigner_badge: string;
  campaigner_is_verified: boolean;
  category_name: string;
  is_forever_running: boolean;
  is_open_goal: boolean;
  request_userdata: boolean;
  donation_target: number;
  donation_percentage: number;
  short_url: string;
}
export interface DonationReport {
  screenshot: string,
  url: string,
  amount: number,
  comment?: string,
  isAnonymous?: boolean,
  test?: boolean,
  title: string,
  duration: number,
  onDonation: string,
}