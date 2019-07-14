import { join } from 'path'
import { createHash } from 'crypto'
import { readFileSync, writeFileSync, writeFile } from 'jsonfile'
import { existsSync, write } from 'fs'
import * as path from 'path'

export function getNumber(input: string) : number {
  return Number(input.match(/\d+/g).join(''))
}
export function isHaveNumber(input: string) : boolean {
  return Array.isArray(input.match(/\d+/g))
}
export function createDonationEvidence(title: string) : string {
  const titleLower = title.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/ /gm, '-').trim()
  return join(__dirname, `../donations/screenshot-donation-${titleLower}-${Date.now()}.png`)
}
export function hash(text: string) : string {
  return createHash('md5').update(text).digest('hex')
}
export function donationHistorySave(donation) {
  let donationHistory = []
  const donationHistoryPath = path.join(__dirname, '../donations/donations.json')
  
  if (existsSync(donationHistoryPath)) {
    donationHistory = readFileSync(donationHistoryPath)
  }

  donationHistory.push(donation)

  writeFileSync(donationHistoryPath, donationHistory)
}