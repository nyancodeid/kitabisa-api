# KitaBisa.com Automation API
Automation API for kitabisa.com website with Puppeteer

### Available Method
1. isLogined
2. signIn
3. getBalance
4. getCampaign
5. getUserStatistic
6. makeDonations

## Initialize
```js
// ES6
import KitaBisa from "kitabisa-api";
const kitaBisa = new KitaBisa();
```
```js
// ES5
const KitaBisa = require("kitabisa-api");
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

## makeDonations
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