# KitaBisa.com Puppeteer
Automation API for kitabisa.com website

### Available Method
1. isLogined
2. signIn
3. getBalance
4. explorerCampaign (TEST)
5. getUserStatistic
6. makeDonations

### isLogined
Check is user is already sign in or not. this checked by is user dashboard redirect into
login pages or not. so we can know is user already sign in or not. this method return `Boolean`  

### signIn
Sign In is only available for KitaBisa account only for now, when you choose login with Google Sign In
some this method successfuly, but google have authentication by using comfirm login action on Phone. 
that's why we not writing sign in with google. 

### getBalance
Try to get `Dompet Kebaikan` wallet balance.

### explorerCampaign 
Gets all campaigns on explorer page, it's still experiment and need more code to make it perfect for crawling.

### getUserStatistic
Gets user information like how many time you make Donation and how many you spend your balance for make donation (donation total)

### makeDonations
Create donation action by fill some options and you will get result and screenshot for evidance.