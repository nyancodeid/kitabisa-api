import { expect } from "chai";
import * as dotenv from "dotenv";
import KitaBisa from "../src/kitabisa";

dotenv.config();

const DONATION_URL_TEST = "https://kitabisa.com/campaign/temaninajwasembuh";
const DONATION_AMOUNT_TEST = 1000;

describe("KitaBisa - Authentication", function() {
  const kitaBisa = new KitaBisa();
  const kitaBisaAccount = {
    email: process.env.TEST_ACCOUNT_EMAIL || process.env.EMAIL,
    password: process.env.TEST_ACCOUNT_PASSWORD || process.env.PASSWD,
  };

  this.timeout(30000);

  after(() => {
    kitaBisa.close();
  });
  it("isInitialized should be false", async () => {
    expect(kitaBisa.isInitialized).equal(false);
  });
  it("signIn() should be true", async () => {
    await kitaBisa.initialize({
      email: kitaBisaAccount.email,
      password: kitaBisaAccount.password,
    });

    expect(kitaBisa.isInitialized).equal(true);
  });
  it("isLogined() should be true", async () => {
    const isLogined = await kitaBisa.isLogined();

    expect(isLogined).equal(true);
    expect(kitaBisa.isInitialized).equal(true);
  });
});

describe("KitaBisa - Method", function() {
  const kitaBisa = new KitaBisa();
  const kitaBisaAccount = {
    email: process.env.TEST_ACCOUNT_EMAIL || process.env.EMAIL,
    password: process.env.TEST_ACCOUNT_PASSWORD || process.env.PASSWD,
  };

  this.timeout(30000);

  after(() => {
    kitaBisa.close();
  });
  it("isInitialized should be true", async () => {
    await kitaBisa.initialize({
      email: kitaBisaAccount.email,
      password: kitaBisaAccount.password,
    });

    expect(kitaBisa.isInitialized).equal(true);
  });
  it("getBalance() return should be number", async () => {
    const balance = await kitaBisa.getBalance();

    expect(balance).to.be.a("object");
    expect(balance.balance).to.be.a("number");
  });
  it("makeDonation() return should be test", async () => {
    const donation = await kitaBisa.makeDonation({
      url: DONATION_URL_TEST,
      amount: DONATION_AMOUNT_TEST,
      isAnonymous: true,
      evidence: false,
      test: true,
    });

    expect(donation).to.be.a("object");
    expect(donation.duration).to.be.a("number");
    expect(donation.test).to.be.a("boolean");
    expect(donation.test).equal(true);
  });
  it("getCampaign() return should be object", async () => {
    const campaigns = await kitaBisa.getCampaign([
      KitaBisa.categories.BENCANA_ALAM,
    ]);

    expect(campaigns).to.be.a("array");
    expect(campaigns.length).greaterThan(0);
  });
});
