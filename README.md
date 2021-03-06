# KitaBisa.com Automation API
Automation API for kitabisa.com website with Puppeteer. Read more on [documentation page](https://nyancodeid.github.io/kitabisa-api/)

[![Repository](https://img.shields.io/badge/github-kitabisa--api-green?logo=github&style=flat)](https://github.com/nyancodeid/kitabisa-api)
![License MIT](https://img.shields.io/github/license/nyancodeid/kitabisa-api)
[![Issues](https://travis-ci.org/nyancodeid/kitabisa-api.svg?branch=master)](https://github.com/nyancodeid/kitabisa-api)

### Example Usage
For example we used `getBalance` for get latest balance and check is available for donations. and
next we grab random `getCampaign` with categories on it. next we run async with for loop to run 
`makeDonation` method. Simple right?

![Example](https://media.giphy.com/media/ZXfIG734grkXQ2NsnP/giphy.gif)

### Available Method
1. [isLogined](#initialize)
2. [getBalance](#getbalance)
3. [getCampaign](#getcampaign)
4. [getUserStatistic](#getuserstatistic)
5. [makeDonation](#makedonation)

## Initialize
```js
// ES6
import KitaBisa from "./dist/kitabisa";
const kitaBisa = new KitaBisa();
```
```js
// ES5
const KitaBisa = require("./dist/kitabisa");
const kitaBisa = new KitaBisa();
```

## Sign In
```js
// async await
await kitaBisa.initialize({
  email: process.env.EMAIL,
  password: process.env.PASSWD
});
```
```js
// promise
kitaBisa.initialize({
  email: "YOUR EMAIL/PHONE",
  password: "YOUR PASSWORD"
}).then(function() {
  // do after login
});
```

## getBalance
```js
// async await
const balance = await kitaBisa.getBalance();
```

## getCampaign 
```js
// async await
const campaigns = await kitaBisa.getCampaign([
  KitaBisa.categories.BENCANA_ALAM,
  KitaBisa.categories.RUMAH_IBADAH
]);

// example result
[ { title: 'Darurat! Alirkan Air Bersih untuk Yogyakarta ',
    url: 'https://kitabisa.com/atasikrisisairgunkid',
    tumbnailUrl:
     'https://img.kitabisa.cc/size/368x196/1484b40a-9b7e-49a9-8b5a-5b3cb0339552.jpg',
    campaigner: 'Aksi Cepat Tanggap DIY',
    isOrganitaion: true,
    isVerified: true,
    dayLeft: 56,
    total: 44538524 } ]
```

## getUserStatistic
```js
// async await
const statistic = await kitaBisa.getUserStatistic();
```

## makeDonation
Create donation action by fill some options and you will get result and screenshot for evidance.
```js
await kitaBisa.makeDonation({
  url: 'https://m.kitabisa.com/daruratkekeringan',
  amount: 1000,
  comment: "Semoga bermanfaat",
  isAnonymous: true
}).then((result) => {
  // do something with result
}).catch(console.error)

// example result
{ title: 'DARURAT AIR BERSIH DI CIAYUMAJAKUNING !',
  duration: 14.104,
  url: 'https://m.kitabisa.com/daruratkekeringan',
  amount: 1000,
  isAnonymous: true,
  comment: 'Semoga bermanfaat',
  screenshot:
   'PATH_TO/screenshot-donation-darurat-air-bersih-di-ciayumajakuning--1564070240601.png' }
```