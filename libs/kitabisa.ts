/// kitabisa.ts 
/// <reference path="./kitabisa.d.ts" />

import * as puppeteer from 'puppeteer'
import * as signale from 'signale'
import * as jsonfile from 'jsonfile'

import { existsSync } from 'fs'
import { join } from 'path'

import { getNumber, isHaveNumber, createDonationEvidence } from './helpers'

export default class KitaBisa {
  public page: puppeteer.Page
  public account: KitaBisa.Account
  public cookieFile: string

  constructor(page: puppeteer.Page, credential: KitaBisa.Account) {
    this.page = page
    this.account = credential
    this.cookieFile = join(__dirname, `../cookies/login-${this.account.email}.json`)
  }

  async initialize() {
    await this.page.setRequestInterception(true)
    await this.blockImageRequest(true)
  }

  async saveCookie() {
    const cookiesObject = await this.page.cookies()
    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile(this.cookieFile, cookiesObject, { spaces: 2 }, function(err) { 
      if (err) {
        signale.info('[KitaBisa] The file could not be written.', err)
      }
      signale.info('[KitaBisa] Session has been successfully saved')
    })
  }
  async loadCookie() : Promise<boolean> {
    const previousSession = existsSync(this.cookieFile)
    if (previousSession) {
      // If file exist load the cookies
      const cookiesArr = require(this.cookieFile)
      if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
          await this.page.setCookie(cookie)
        }
        signale.info('[KitaBisa] Session has been loaded in the browser')
        return true
      }
    } 

    return false
  }

  async isLogined() {
    await this.page.goto('https://www.kitabisa.com/dashboard/overview', { waitUntil: "networkidle2" })

    if (this.page.url().includes('login')) return false
    // clear page
    await this.clearPage()
    return true
  }
  async signIn() {
    await this.page.goto('https://www.kitabisa.com/login', { waitUntil: 'networkidle2' })
    await this.page.waitFor(2000)

    signale.info('[KitaBisa] start kitabisa login process')
    // login email/phone field
    await this.page.waitForSelector('#login_input_email')
    await this.page.type('#login_input_email', this.account.email )
    // password field
    await this.page.waitForSelector('#showPassField', { visible: true })
    await this.page.type('#showPassField', this.account.password )
    // remember login checkbox
    await this.page.waitForSelector('#login_btn_remember');
    await this.page.click('#login_btn_remember');

    signale.info('[KitaBisa] start screenshot login process')

    await this.page.click('#login_btn_submit');
    await this.saveCookie()

    // don't forget to clear page for reduce memory
    this.clearPage()
  }

  async getBalance() : Promise<KitaBisa.Balance> {
    signale.info("[KitaBisa] getting kitabisa account balance (Dompet Kebaikan)")
    await this.page.goto('https://www.kitabisa.com/dashboard/wallet', { waitUntil: "networkidle2" })

    await this.page.waitForSelector('.box-wallet__amount');
    
    const element = await this.page.$('.box-wallet__amount');
    const balanceRaw = await this.page.evaluate(element => element.textContent, element);
    
    // don't forget to clear page 
    // for reduce memory
    await this.clearPage()

    return {
      balance: getNumber(balanceRaw)
    }
  }
  async explorerCampaign() : Promise<Array<KitaBisa.Campaign>> {
    await this.page.goto('https://www.kitabisa.com/explore/all', { waitUntil: "networkidle2" })

    const result = await this.page.evaluate(() => {
      const campaigns = Array.from(document.querySelectorAll('.campaign-container .flex-container__item'))
        .map(campaign => {
          const title: string = campaign.getElementsByClassName('m-card__title')[0].textContent.trim()
          const url: string = campaign.getElementsByClassName('m-card__href')[0].getAttribute('href')
          const tumbnailUrl: string = campaign.getElementsByClassName('m-card__thumb')[0].getAttribute('src')
          const campaigner: string = campaign.querySelectorAll('.m-card__subtitle-wording > span.text-14')[0].textContent.trim()
          const logo: string = campaign.querySelectorAll('.m-card__subtitle-wording > img.m-card__check')[0].getAttribute('src')
          
          let dayLeft: string = campaign.querySelector('.m-card__countitem:nth-child(1)').innerHTML
          let total: string = campaign.querySelector('.m-card__countitem:nth-child(2)').innerHTML

          const status = {
            isOrganitaion: false,
            isVerified: false
          }

          if (logo.includes('org') && !logo.includes('user')) {
            status.isOrganitaion = true
          } 
          if (logo.includes('verified')) {
            status.isVerified = true
          }
 
          return {
            title: title,
            url: url,
            tumbnailUrl: tumbnailUrl,
            campaigner: campaigner,
            isOrganitaion: status.isOrganitaion,
            isVerified: status.isVerified,
            dayLeftRaw: dayLeft,
            totalRaw: total,
            dayLeft: 0,
            total: 0
          }
        })

      return campaigns
    })
    // don't forget to clear page for reduce memory
    await this.clearPage()
    // return 
    return result.map(campaign => {
      if (isHaveNumber(campaign.dayLeftRaw)) campaign.dayLeft = getNumber(campaign.dayLeftRaw)
      campaign.total = getNumber(campaign.totalRaw)

      // remove raw value 
      delete campaign.totalRaw
      delete campaign.dayLeftRaw

      return campaign
    })
  }
  async getUserStatistic() : Promise<KitaBisa.UserStat> {
    const result = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('span.o-box__count')

      return {
        donation: elements[1].textContent,
        spend: elements[2].textContent
      }
    })

    // don't forget to clear page
    await this.clearPage()

    return {
      donation: getNumber(result.donation),
      spend: getNumber(result.spend)
    }
  }
  async makeDonation(options: KitaBisa.DonationOptions) {
    const startTask = Date.now()
    const navigationPromise = this.page.waitForNavigation({ waitUntil: "networkidle2" })

    if (options.amount < 1000) return Promise.reject(Error('[KitaBisa] unable to make donation, donation "amount" is under 1000'))
    // default `isAnonymous` is true. hide the identity of donors
    options.isAnonymous = (typeof options.isAnonymous === "boolean") ? options.isAnonymous : true
    
    signale.info('[KitaBisa] opening campaign page')
    await this.page.goto(options.url, { waitUntil: "load" })
    
    await this.page.waitForSelector('.container > .cols > .side-col > .contribution > .btn-contribute')
    const title = await this.page.title().then(title => title.replace('Kitabisa! - ', ''))
    await this.click('.container > .cols > .side-col > .contribution > .btn-contribute')
    
    const waitPageContribute = await navigationPromise
    await this.page.waitFor(5000)

    signale.info('[KitaBisa] campaign title is ' + title)
    signale.info('[KitaBisa] is page url ' + waitPageContribute.url())
    signale.info('[KitaBisa] prepare for make donation. donations detail field')
    // write donation amount
    await this.page.waitForSelector('.white-box #target-donasi')
    await this.page.type('.white-box #target-donasi', options.amount.toString())
    // click "pilih", to select payment method. default is "Dompet Kebaikan"
    await this.page.waitForSelector('.category-select > .category-select-head > .col > .col--s2 > .text-blue')
    await this.click('.category-select > .category-select-head > .col > .col--s2 > .text-blue'); 
    // wait for sec for payment select modal opened
    await this.page.waitFor(5000)
    // select "Dompet Kebaikan" as payment method
    await this.page.waitForSelector('.list-nostyle > .category-select-list__item:nth-child(2) > .col > .col--s10 > .flex-1')
    await this.page.click('.list-nostyle > .category-select-list__item:nth-child(2) > .col > .col--s10 > .flex-1')
    // set donation as anonymous
    if (options.isAnonymous) {
      await this.page.waitForSelector('#yw0 > .white-box > .form__row > #termsCheckCampaigner')
      await this.page.click('#yw0 > .white-box > .form__row > #termsCheckCampaigner')
    }
    // set donation comment
    await this.page.waitForSelector('.main-col > #yw0 #Donations_comment')
    await this.page.type('.main-col > #yw0 #Donations_comment', options.comment)
     
    if (options.test) {
      return { 
        title: title,
        duration: (Date.now() - startTask) / 1000,
        ...options,
        page: this.page
      }
    }
    // submit donation details
    await this.page.waitForSelector('.main-col > #yw0 > .btn > .btn--vform > .va-m')
    await this.click('.main-col > #yw0 > .btn > .btn--vform > .va-m')
    
    await navigationPromise
    await this.page.waitFor(5000)
    
    signale.info('[KitaBisa] confirm donation')
    await this.page.waitForSelector('.cols > .main-col > .white-box > p > .btn')

    const pageTitle = await this.page.title()
    if (!pageTitle.includes('Rangkuman Pembayaran')) return Promise.reject(Error("[KitaBisa] unable to verified campaign payment"))

    signale.info('[KitaBisa] confirm donation action and payment')
    await this.click('.cols > .main-col > .white-box > p > .btn')

    await navigationPromise
    await this.page.waitFor(2000)

    signale.info('[KitaBisa] now page url is ' + this.page.url())
    // save donation thanks from kitabisa.com
    const screenshotPath = createDonationEvidence(title)

    signale.info('[KitaBisa] Save donation detail screenshot')
    await this.page.screenshot({ path: screenshotPath })

    await this.clearPage()

    return {
      title: title,
      duration: (Date.now() - startTask) / 1000,
      ...options,
      screenshot: screenshotPath
    }
  }

  private async click(selector: string) : Promise<any> {
    await this.page.waitFor(2000)

    return this.page.evaluate((selector) => document.querySelector(selector).click(), selector);
  }
  private async blockImageRequest(block: boolean) {
    const callbackRequest = (request: puppeteer.Request) => {
      // block only resouceType images and not from kitabisa.com assets (web required)
      if (request.resourceType() === 'image' && !request.url().includes('assets.kitabisa.com/images/')) {
        request.abort();
      } else {
        request.continue();
      }
    }
    
    if (block)
      this.page.on('request', callbackRequest);
    else 
      this.page.off('request', callbackRequest);
  }
  private clearPage() {
    return this.page.goto('about:blank')
  }
} 