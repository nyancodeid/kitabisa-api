import * as puppeteer from "puppeteer";
import * as jsonfile from "jsonfile";
import * as signale from "signale";
import axios from "axios";

import { existsSync, unlinkSync } from "fs";
import { join } from "path";

import * as Elements from "./elements";
import * as Helpers from "./helpers";
import * as KitaBisaType from "./core.d";

const COOKIES_PATH = "../cookies";

/**
 * @typedef {object} DonationOption
 * @property {string} url
 * @property {number} amount
 * @property {string} comment optional default: ''
 * @property {boolean} isAnonymous optional default: true
 * @property {boolean} test optional default: false
 */

export default class Core {
  public static readonly categories = {
    BEASISWA_PENDIDIKAN: 5,
    BALITA: 8,
    BANTUAN_MEDIS: 9,
    BENCANA_ALAM: 22,
    ULANG_TAHUN: 26,
    DIFABEL: 24,
    FAMILY_FOR_FAMILY: 41,
    HADIAH_APRESIASI: 21,
    KARYA_KREATIF: 13,
    KEGIATAN_SOSIAL: 7,
    KEMANUSIAAN: 42,
    LINGKUNGAN: 6,
    HEWAN: 19,
    MODAL_USAHA: 33,
    PANTI_ASUHAN: 28,
    PRODUK_INOVASI: 3,
    RUMAH_IBADAH: 23,
    INFRASTRUKTUR: 11,
    ZAKAT: 27,
    LAINNYA: 20,
    ALL: 0,
  };
  public page: puppeteer.Page;
  public account: KitaBisaType.Account;
  public cookieFile: string;

  public setCredential(credential: KitaBisaType.Account) {
    const hashFile = Helpers.hash(`cookie-login-${credential.email}`);

    this.account = credential;
    this.cookieFile = join(__dirname, `${COOKIES_PATH}/${hashFile}.json`);
  }
  public async loadCookie(): Promise<boolean> {
    const previousSession = existsSync(this.cookieFile);
    if (previousSession) {
      // If file exist load the cookies
      const cookiesArr = require(this.cookieFile);
      if (cookiesArr.length !== 0) {
        for (const cookie of cookiesArr) {
          await this.page.setCookie(cookie);
        }
        signale.info("[KitaBisa] Session has been loaded in the browser");
        return true;
      }
    }

    return false;
  }
  /**
   * Check is user is already sign in or not. this checked by is user dashboard redirect into
   * login pages or not. so we can know is user already sign in or not.
   */
  public async isLogined() {
    await this.page.goto("https://m.kitabisa.com/login", { waitUntil: "domcontentloaded" });

    const pageUrl = this.page.url();
    // clear page
    await this.clearPage();

    if (pageUrl.includes("login")) { return false; }
    return true;
  }
  /**
   * @async
   * @method signIn
   * @description Sign In is only available for KitaBisa account only for now, when you choose login
   * with Google Sign In some this method successfuly, but google have authentication
   * by using comfirm login action on Phone. that's why we not writing sign in with google.
   */
  public async signIn(): Promise<KitaBisaType.SignInResult> {
    try {
      signale.info("[KitaBisa][1/4] Start kitabisa login process");
      await this.page.goto("https://m.kitabisa.com/login", { waitUntil: "load" });

      signale.info("[KitaBisa][2/4] Wait all elements");
      await Promise.all([
        this.page.waitForSelector("#mlogin_input_email"),
        this.page.waitForSelector("#showPassField", { visible: true }),
        this.page.waitForSelector("#mlogin_btn_remember"),
        this.page.waitForSelector("#mlogin_btn_submit"),
      ]);

      signale.info("[KitaBisa][3/4] Input login field");
      // login email/phone field
      await this.page.type("#mlogin_input_email", this.account.email );
      // password field
      await this.page.type("#showPassField", this.account.password );
      // remember login checkbox
      await this.page.click("#mlogin_btn_remember");
      // submit login
      await this.page.click("#mlogin_btn_submit");
      // save login cookie
      await this.saveCookie();
      const pageUrl = this.page.url();
      // don't forget to clear page for reduce memory
      await this.clearPage();

      if (pageUrl.indexOf("login") === -1) {
        signale.success("[KitaBisa][4/4] Sign In Done!");

        return { success: true, hash: Helpers.hash(`cookie-login-${this.account.email}`) };
      } else {
        signale.error("[KitaBisa][4/4] Unable to login, error on credential");

        return { success: false };
      }
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * @async
   * @method signOut
   * @description Sign Our from KitaBisa.com site and remove stored cookie file on cookies folder
   */
  public async signOut(): Promise<boolean> {
    await this.page.goto("https://m.kitabisa.com/logout", { waitUntil: "domcontentloaded" });

    return await this.removeCookie();
  }

  /**
   * @async
   * @method getBalance
   * @description Get `Dompet Kebaikan` wallet balance. This return balance left on wallet as a number
   */
  public async getBalance(): Promise<KitaBisaType.Balance> {
    signale.info("[KitaBisa] getting kitabisa account balance (Dompet Kebaikan)");
    await this.page.goto("https://www.kitabisa.com/dashboard/wallet", { waitUntil: "networkidle2" });

    if (this.page.url().includes("login")) { throw Error(`Unauthorized`); }

    await this.page.waitForSelector(Elements.statistic.balance);

    const element = await this.page.$(Elements.statistic.balance);
    const balanceRaw = await this.page.evaluate((elementDOM) => elementDOM.textContent, element);

    // don't forget to clear page for reduce memory
    await this.clearPage();

    return {
      balance: Helpers.getNumber(balanceRaw),
    };
  }
  /**
   * @async
   * @method getCampaign
   * @description Gets some campaigns from explorer ajax request. Filtered for some category and only
   * organization
   * @param {number[]} categories Array of KitaBisa campaign categories
   */
  public async getCampaign(categories: number[]): Promise<KitaBisaType.Campaign[]> {
    if (!Array.isArray(categories)) {
      throw Error("parameter 'categories' must be array");
    }

    const sources = categories.map(
      (category) => `https://www.kitabisa.com/ajax/explore/${Helpers.randomNumber(1, 30, 3)}-3.json?category=${category}&filter=organization`,
    );

    const campaignsPromise = sources.map(async (source: string) => {
      const res = await axios.get(source);
      return res.data;
    });

    const campaigns = await Promise.all(campaignsPromise);
    const formatedCampaigns = [];

    for (const campaign of campaigns) {
      for (const list of campaign.campaigns) {
        const status = { isOrganitaion: false, isVerified: false };
        const dayLeft = (typeof list.deadline !== "number") ? 0 : list.deadline;

        if (list["tag-icon"].includes("org") && !list["tag-icon"].includes("user")) {
          status.isOrganitaion = true;
        }
        if (list["tag-icon"].includes("verified")) {
          status.isVerified = true;
        }

        formatedCampaigns.push({
          title: list.title,
          url: list.href,
          tumbnailUrl: list.image,
          campaigner: list.campaigner,
          isOrganitaion: status.isOrganitaion,
          isVerified: status.isVerified,
          dayLeft,
          total: Helpers.getNumber(list.donation),
        });
      }
    }

    return formatedCampaigns;
  }
  /**
   * @async
   * @method getUserStatistic
   * @description Gets user information how much you spend your balance for make donation (donation total)
   */
  public async getUserStatistic(): Promise<KitaBisaType.UserStatistic> {
    await this.page.goto("https://m.kitabisa.com/dashboard/donations", { waitUntil: "networkidle2" });

    if (this.page.url().includes("login")) { throw Error(`Unauthorized`); }

    await this.page.waitForSelector(Elements.statistic.donationTotal);

    const result = await this.page.evaluate((donationTotal) => {
      const element = document.querySelector(donationTotal);

      return {
        spend: element.textContent,
      };
    }, Elements.statistic.donationTotal);

    // don't forget to clear page
    await this.clearPage();

    return {
      spend: Helpers.getNumber(result.spend),
    };
  }
  /**
   * @async
   * @method makeDonation
   * @desciption Create donation action by fill some options and you will get result and screenshot for
   * evidance.
   * @param {DonationOption} options donation options
   */
  public async makeDonation(options: KitaBisaType.DonationOptions) {
    const startTask = Date.now();

    if (typeof options !== "object") {
      return Promise.reject(Error("[KitaBisa] makeDonations should have options as object")); }
    if (options.amount < 1000) {
      return Promise.reject(Error('[KitaBisa] unable to make donation, donation "amount" is under Rp. 1.000')); }

    // default `isAnonymous` is true. hide the identity of donors
    options.isAnonymous = (typeof options.isAnonymous === "boolean") ? options.isAnonymous : true;
    // default `comment` is empty string.
    options.comment = (typeof options.comment === "string") ? options.comment : "";

    signale.info("[KitaBisa][1/5] navigate to campaign page");
    await this.page.goto(options.url + "/contribute", { waitUntil: "load" });

    const title = await this.page.title().then((titleDOM) => titleDOM.replace("Kitabisa! - ", ""));

    signale.info("[KitaBisa][1/5] campaign title is " + title);
    signale.info("[KitaBisa][2/5] prepare for make donation. donations detail field");

    // check is campaign has `login` button, is not null mean login button exist (Unauthorized)
    if (await this.page.$(Elements.donation.login) !== null) { throw Error(`Unauthorized`); }

    // wait all element to be available and check
    await Promise.all([
      this.page.waitForSelector(Elements.donation.input),
      this.page.waitForSelector(Elements.donation.wallet),
      this.page.waitForSelector(Elements.donation.hideName),
      this.page.waitForSelector(Elements.donation.comment),
      this.page.waitForSelector(Elements.donation.submit),
    ]);

    // write donation amount
    await this.page.type(Elements.donation.input, options.amount.toString());
    // select "Dompet Kebaikan" as payment method
    await this.page.click(Elements.donation.wallet);
    // set donation as anonymous
    if (options.isAnonymous) {
      await this.page.click(Elements.donation.hideName);
    }
    // set donation comment
    await this.page.type(Elements.donation.comment, options.comment);

    if (options.test) {
      return {
        title,
        duration: (Date.now() - startTask) / 1000,
        ...options,
      };
    }
    // submit donation details
    await this.click(Elements.donation.submit);
    // wait navigator to be ready
    await this.page.waitForNavigation({ waitUntil: "load" });

    const pageTitle = await this.page.title();
    if (!pageTitle.includes("Rangkuman Pembayaran")) {
      return Promise.reject(Error("[KitaBisa] unable to verified campaign payment")); }

    signale.info("[KitaBisa][3/5] Confirmed donation action and process payment");
    // click on `confirm donation` and wait to redirect
    await this.page.waitForSelector(Elements.confirm.button);
    await this.click(Elements.confirm.button);
    // wait navigator to be ready
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    signale.info("[KitaBisa][4/5] Payment Done.");
    signale.info("[KitaBisa][5/5] Save donation detail screenshot");
    // save donation thanks from kitabisa.com
    const screenshotPath = Helpers.createDonationEvidence(title);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    await this.clearPage();

    const donationItem = {
      title,
      duration: (Date.now() - startTask) / 1000,
      ...options,
      screenshot: screenshotPath,
      onDonation: new Date().toLocaleString(),
    };

    // save donation on donations history
    Helpers.donationHistorySave(donationItem);

    signale.success("[KitaBisa][5/5] donation success!");

    return donationItem;
  }

  /**
   * @async
   * @method click
   * @description Evaluate click on spesific selector
   * @param {string} selector query selector element to click
   */
  private async click(selector: string): Promise<any> {
    // await this.page.waitFor(2000)
    return this.page.evaluate((selectorDOM) => document.querySelector(selectorDOM).click(), selector);
  }
  /**
   * @method clearPage
   * @description Clear page by navigate to `about:blank` page
   */
  private clearPage() {
    return this.page.goto("about:blank");
  }
  /**
   * @async
   * @method saveCookie
   * @description Save cookies after login with `hashing` name and `json` format
   */
  private async saveCookie() {
    const cookiesObject = await this.page.cookies();
    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile(this.cookieFile, cookiesObject, { spaces: 2 }).then(() => {
      signale.info("[KitaBisa] Session has been successfully saved");
    }).catch((error) => {
      signale.info("[KitaBisa] The file could not be written.", error);
    });
  }
  /**
   * @async
   * @method removeCookie
   * @description Remove cookie file
   */
  private async removeCookie(): Promise<boolean> {
    try {
      const previousSession = existsSync(this.cookieFile);
      if (previousSession) {
        unlinkSync(this.cookieFile);
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }
}
