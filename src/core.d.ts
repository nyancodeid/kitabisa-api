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
  campaigner: string,
  title: string,
  donation: string,
  image: string,
  href: string,
  progress: Progress,
  deadline: string,
  label: boolean,
  "label-property": LabelProperty,
  tag: boolean,
  "tag-icon": string,
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