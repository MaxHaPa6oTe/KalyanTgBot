require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('Ошибка: переменная BOT_TOKEN не установлена в файле .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// экспортируем объект бота
module.exports = bot;