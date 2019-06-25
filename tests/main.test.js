const Apps = require('../app')

describe('KitaBisa:module', () => {
  const apps = new Apps({ email: process.env.EMAIL, password: process.env.PASSWD });

  beforeAll(async () => {
    await apps.initialize()
  })

  it('should be ', async () => {
    apps.main()
  })
})
describe('KitaBisa:login', () => {
  let page = null

  beforeAll(async () => {
    page = await global.__BROWSER__.newPage();
  });

  it('should be titled "Kitabisa! - Login"', async () => {
    await page.goto('https://www.kitabisa.com/dashboard/overview', { waitUntil: "networkidle2" });
    await expect(page.title()).resolves.toMatch('Kitabisa! - Login');
  });

  it('should be have email and password field for login', async () => {
    await page.goto('https://www.kitabisa.com/login', { waitUntil: "networkidle2" });

    try {
      await page.waitForSelector('#login_input_email')
      await page.waitForSelector('#showPassField', { visible: true })

      const emailField = await page.$eval('#login_input_email', (el, attribute) => el.getAttribute(attribute), 'placeholder');

      await expect(emailField).toMatch('Nomor WhatsApp atau Email Anda')
    } catch(e) {
      console.error(e)
      throw Error(`Timeout: selector not showing`)
    }
  });
});