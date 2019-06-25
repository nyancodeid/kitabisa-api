import { join } from 'path'

export function getNumber(input: string) : number {
  return Number(input.match(/\d+/g).join(''))
}
export function isHaveNumber(input: string) : boolean {
  return Array.isArray(input.match(/\d+/g))
}
export function createDonationEvidence(title: string) : string {
  const titleLower = title.toLowerCase().replace(' ', '-')
  return join(__dirname, `../donations/screenshot-donation-${titleLower}-${Date.now()}.png`)
}