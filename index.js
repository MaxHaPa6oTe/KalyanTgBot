const contextManager = require('./zapis/func/contextManager');
const calendarUtils = require('./zapis/func/calendarUtils');
const timeUtils = require('./zapis/func/timeUtils');
const chat = require('./zapis/chat');
const bot = require('./bot');
const sequelize = require('./config/database');
const { syncModels } = require('./models'); // функция для синхронизации моделей
const sms = require('./sms')(sequelize);

const userContexts = {};

async function init() {
  try {
    await sequelize.authenticate();
    await syncModels();

// Инициализация модулей
const cm = contextManager(userContexts);
const cu = calendarUtils(cm);
const tu = timeUtils(cm);
const rh = chat(bot, cm, cu, tu,);

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  rh.start(msg.chat.id);
});
sms.startReminderService();
 console.log('Инициализация завершена.');

  } catch (err) {
    console.error('Ошибка при запуске:', err);
  }
}

init();