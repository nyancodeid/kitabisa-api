import * as puppeteer from 'puppeteer'
import * as signale from 'signale'

import KitaBisa from './libs/kitabisa'

export default class Apps {
  public account: KitaBisa.Account
  public kitaBisa: KitaBisa

  public browser: puppeteer.Browser
  public page: puppeteer.Page

  constructor(account: KitaBisa.Account) {
    this.account = account
  }

  async initialize() {
    signale.info('[Apps] start browser')
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.kitaBisa = new KitaBisa(this.page, this.account)

    await this.kitaBisa.initialize()
    await this.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36')
  }

  async main() {
    signale.info('[Apps] load latest login cookies')
    await this.kitaBisa.loadCookie();
    
    const isLogined: boolean = await this.kitaBisa.isLogined();
    
    if (isLogined) {
      signale.info('[Apps] navigate browser to kitabisa.com login page')
      await this.kitaBisa.signIn();
    }

    await this.browser.close()
  }
}