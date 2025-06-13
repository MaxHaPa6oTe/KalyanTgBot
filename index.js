const contextManager = require('./zapis/func/contextManager');
const calendarUtils = require('./zapis/func/calendarUtils');
const timeUtils = require('./zapis/func/timeUtils');
const chat = require('./zapis/chat');
const bot = require('./bot');
const sequelize = require('./config/database');
const { syncModels } = require('./models');
const sms = require('./sms')(sequelize);
const commands = require('./zapis/commands');
const adminCommands = require('./zapis/adminCommands');
require('dotenv').config();

const userContexts = {};

async function init() {
  try {
    await sequelize.authenticate();
    await syncModels();

    // Инициализация модулей
    const cm = contextManager(userContexts);
    const cu = calendarUtils(cm);
    const tu = timeUtils(cm);
    const rh = chat(bot, cm, cu, tu);

    // Функция для отправки сообщения с кнопкой быстрого доступа
    const sendAdminQuickAccess = (chatId) => {
      if (chatId.toString() === process.env.TG_ID) {
        bot.sendMessage(chatId, 'Включена админ-панель!', {
          reply_markup: {
            keyboard: [
              [{ text: '📊 Показать брони на неделю' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
          }
        });
      }
    };

    // Обработчик команды /start
    bot.onText(/\/start/, (msg) => {
      rh.start(msg.chat.id);
      sendAdminQuickAccess(msg.chat.id);
    });

    // Обработчик текстовых сообщений (для кнопки быстрого доступа)
    bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      
      if (chatId.toString() === process.env.TG_ID && msg.text === '📊 Показать брони на неделю') {
        adminCommands.showWeeklyReservations(bot, chatId);
      }
    });

    // Обработчик callback запросов (для отмены брони)
    bot.on('callback_query', async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      try {
        if (data.startsWith('ask_cancel_')) {
          const reservationId = data.split('_')[2];
          await commands.askCancelConfirmation(bot, chatId, reservationId, messageId);
        }
        else if (data.startsWith('confirm_cancel_')) {
          const reservationId = data.split('_')[2];
          await commands.cancelReservation(bot, chatId, reservationId, messageId);
        }
        else if (data.startsWith('reject_cancel_')) {
          await bot.deleteMessage(chatId, messageId);
        }
        else if (data === 'refresh_week' && chatId.toString() === process.env.TG_ID) {
          await bot.deleteMessage(chatId, messageId);
          await adminCommands.showWeeklyReservations(bot, chatId);
        }

      } catch (error) {
        console.error('Ошибка обработки callback:', error);
        await bot.sendMessage(chatId, '⚠️ Произошла ошибка. Попробуйте еще раз.');
      } finally {
        bot.answerCallbackQuery(callbackQuery.id);
      }
    });

    // Обработчик команды /my_bron
    bot.onText(/\/my_bron/, (msg) => {
      commands.showUserReservations(bot, msg.chat.id);
    });

    // Обработчик команды /info
    bot.onText(/\/info/, (msg) => {
      commands.showContacts(bot, msg.chat.id);
    });

    sms.startReminderService();
    console.log('✅ Бот успешно запущен');

  } catch (err) {
    console.error('❌ Ошибка при запуске бота:', err);
  }
}

init();