import { join } from "path";
import { createHash } from "crypto";
import * as signale from "signale";
import { readFileSync, writeFileSync } from "jsonfile";
import { existsSync } from "fs";
import { DonationReport } from "./core.d";
import * as path from "path";

const DONATIONS_PATH = "../donations";

/**
 * @description extract number from plain text
 * @param {string} input plain text
 */
export function getNumber(input: string): number {
  return Number(input.match(/\d+/g).join(""));
}
/**
 * @description check is any number avaialble in plain text
 * @param {string} input plain text
 */
export function isHaveNumber(input: string): boolean {
  return Array.isArray(input.match(/\d+/g));
}
/**
 * @description Create random number by ranges and spesific multiple number
 * @param {number} min minimum number range
 * @param {number} max maximum number range
 * @param {number} multiple multiple number to show
 */
export function randomNumber(min: number, max: number, multiple: number): number {
  return Math.round((Math.random() * (max - min) + min) / multiple ) * multiple;
}
/**
 * @description Create path of donation screenshot
 * @param {string} title donation title
 */
export function createDonationEvidence(title: string): string {
  const titleLower = title.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/ /gm, "-").trim();
  return join(__dirname, `${DONATIONS_PATH}/screenshot-donation-${titleLower}-${Date.now()}.png`);
}
/**
 * @description Create MD5 Hash from plain text
 * @param {string} text plain text
 */
export function hash(text: string): string {
  return createHash("md5").update(text).digest("hex");
}
/**
 * @description Append object into array that stored on `donations.json` 
 * to save `DonationReport`
 * @param {string} donation DonationReport object
 */
export function donationHistorySave(donation: DonationReport) {
  let donationHistory = [];
  const donationHistoryPath = path.join(__dirname, `${DONATIONS_PATH}/donations.json`);

  try {
    if (existsSync(donationHistoryPath)) {
      donationHistory = readFileSync(donationHistoryPath);
    }

    donationHistory.push(donation);

    writeFileSync(donationHistoryPath, donationHistory, {
      spaces: 2,
    });
  } catch (error) {
    signale.error("Unable to save donations history");
  }
}
