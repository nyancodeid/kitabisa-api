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

export default class KitaBisa extends Core {
  public account: KitaBisaType.Account;

  public browser: puppeteer.Browser;
  public page: puppeteer.Page;
  public isRedirected: boolean;
  public isNeedEvidence: boolean;

  constructor() {
    super();
  }

  /**
   * @description initialize KitaBisa account before starting
   * @param {Account} account
   */
  public async initialize(account: KitaBisaType.Account) {
    signale.info("[Apps][1/4] start browser");

    const exts = [
      join(__dirname, "../exts/disconnect/5.19.3_0"),
      join(__dirname, "../exts/ublock/1.21.6_0"),
    ];

    // initialize puppeteer browser to launch and add new page
    // use `headless: false` on development env
    this.browser = await puppeteer.launch({
      devtools: false,
      headless: true,
      args: [
        "--disable-features=site-per-process",
        "--disable-extensions-except=" + exts.join(","),
        "--load-extensions=" + exts.join(","),
      ] });
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
   * @method close
   * @description close handless browser
   */
  public async close() {
    try {
      await this.browser.close();

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
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
    const redirectStatuses = [301, 302, 303, 307, 308];
    const callbackRequest = (request: puppeteer.Request) => {
      const headers = request.headers();
      // Allow all request from evidence and thanks page after make deposit.
      // To show as normal website display (for evidence).
      if (headers.referer && this.isNeedEvidence) {
        if (headers.referer.includes("pay-with-wallet/done")) {
          return request.continue();
        }
      }

      // block only resouceType images and not from kitabisa.com assets (web required)
      if (this.isRedirected && request.resourceType() !== "document") {
        return request.abort();
      }
      if (request.resourceType() === "image" && !request.url().includes("assets.kitabisa.com/images/")) {
        // Block requests with the type of images
        // and not from kitabisa origin assets
        request.abort();
      } else if (request.resourceType() === "script" && !request.url().includes("kitabisa.com")) {
        // Block requests with the type of script
        // and not from kitabisa origin web
        request.abort();
      } else if (request.resourceType() === "stylesheet") {
        // Block request with the type of stylesheet/css
        request.abort();
      } else if (request.url().includes("asset_icons")) {
        // Block request with `assets_icons` included on url
        request.abort();
      } else {
        request.continue();
      }
    };
    const callbackResponse = (response: puppeteer.Response) => {
      // Check is reponse as Redirect from login pages?
      if (redirectStatuses.includes(response.status())
        && response.request().resourceType() === "document"
        && response.url() === "https://m.kitabisa.com/login") {
          this.isRedirected = true;
      }
    };

    if (block) {
      this.page.on("request", callbackRequest);
      this.page.on("response", callbackResponse);
    } else {
      this.page.off("request", callbackRequest);
      this.page.off("response", callbackResponse);
    }
  }
}
