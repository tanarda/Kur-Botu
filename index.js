require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js")
const axios = require('axios')
var CronJob = require('cron').CronJob;
var bot = require('./telegramClient.js')

//Güncel kur bilgilerini fixer api kullanarak çeker ve bir kur bilgisi mesajı oluşturur 

let latestCall = null
let sonKurBilgisi = null
async function getCurrencyData() {
  try {
    const response = await axios.get("http://data.fixer.io/api/latest?access_key=${process.env.FIXER_APIKEY}&symbols=XAU,USD,TRY");
    const kurBilgisi = `Dolar: ${(response.data.rates.TRY / response.data.rates.USD).toFixed(2)} TL\nEuro: ${response.data.rates.TRY.toFixed(2)} TL\nGram Altın: ${Math.round((response.data.rates.TRY / response.data.rates.XAU) / 31.1034768)} TL`;
    latestCall = response.data
    sonKurBilgisi = kurBilgisi
    return kurBilgisi;
  } catch (error) {
    console.log(error);
    return null;
  }
}

//Verilen mesajı tweet olarak gönderir.
async function tweet(message){
  try {
    await twitterClient.v2.tweet(message);
  } catch (e) {
    console.log(e)
  }
}

//Telegram grubuna #kur mesajı geldiğinde kur bilgisini yanıt olarak gönderir.
bot.onText(/#kur/i,async (msg, match) => {
  const chatId = msg.chat.id;
  currentDate  = new Date().getTime()
  let message = null
  if(latestCall==null || (currentDate-(latestCall.timestamp1000))>300000){
    message = await getCurrencyData()
  }
  else{
    message = sonKurBilgisi
  }
  bot.sendMessage(chatId,message);
});

//Her saat başı twitter'a kur bilgisini tweet atar.
const cronTweet = new CronJob("0 0 * * *", async () => {
  const kurBilgisi = await getCurrencyData()
  tweet(kurBilgisi)
});

cronTweet.start();