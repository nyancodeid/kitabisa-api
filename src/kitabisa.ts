import * as puppeteer from "puppeteer";
import * as signale from "signale";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import Core from "./core";
import * as KitaBisaType from "./core.d";

/**
 * @typedef {object} Account
 * @property {string} email kitabisa email account
 * @property {string} password kitabisa password account
 */

class KitaBisa extends Core {
  public account: KitaBisaType.Account;

  public browser: puppeteer.Browser;
  public page: puppeteer.Page;

  constructor() {
    super();
  }

  /**
   * @description initialize KitaBisa account before starting
   * @param {Account} account
   */
  public async initialize(account: KitaBisaType.Account) {
    signale.info("[Apps][1/4] start browser");
    // initialize puppeteer browser to launch and add new page
    // use `headless: false` on development env
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();
    // create request handler to filter unused css and images
    await this.requestHandler(true);
    // turn on Puppeteer Request Interception
    await this.page.setRequestInterception(true);
    // set custom user agent
    await this.page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Mobile/14E5239e Safari/602.1");

    signale.info("[Apps][2/4] engine is ready!");

    const COOKIES_PATH = join(__dirname, "../cookies/");
    const DONATIONS_PATH = join(__dirname, "../donations/");
    // check `COOKIES_PATH` and `DONATIONS_PATH`, create folder
    // when it doesn't exists
    if (!existsSync(COOKIES_PATH)) { mkdirSync(COOKIES_PATH); }
    if (!existsSync(DONATIONS_PATH)) { mkdirSync(DONATIONS_PATH); }
    // set `KitaBisa` credential account (email and password)
    await this.setCredential(account);
    // run authentication
    await this.authenticate();
  }

  /**
   * @method authenticate
   * @description load last stored cookie and check is account is already logined in
   * by doing redirect page test.
   * @async
   */
  private async authenticate() {
    signale.info("[Apps][3/4] load latest login cookies");
    await this.loadCookie();
    // is logined?
    const isLogined: boolean = await this.isLogined();

    if (!isLogined) {
      signale.info("[Apps][3/4] navigate browser to kitabisa.com login page");
      // do Sign In process
      await this.signIn();
    }

    signale.info("[Apps][3/4] authentication done!");
    signale.success("[Apps][4/4] initialize done!");
  }

  /**
   * @method requestHandler
   * @description create request handler for Puppeteer Request Interception
   * @param {boolean} block turn on and turn off handler
   * @async
   */
  private async requestHandler(block: boolean) {
    const callbackRequest = (request: puppeteer.Request) => {
      const headers = request.headers();
      if (headers.referer) {
        if (headers.referer.indexOf("pay-with-wallet/done") !== -1) {
          return request.continue();
        }
      }

      // block only resouceType images and not from kitabisa.com assets (web required)
      if (request.resourceType() === "image" && !request.url().includes("assets.kitabisa.com/images/")) {
        request.abort();
      } else if (request.resourceType() === "stylesheet") {
        request.abort();
      } else {
        request.continue();
      }
    };

    if (block) {
      this.page.on("request", callbackRequest);
    } else {
      this.page.off("request", callbackRequest);
    }
  }
}

module.exports = KitaBisa;
