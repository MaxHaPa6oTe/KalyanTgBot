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

    // Обработчик callback запросов
    bot.on('callback_query', async (callbackQuery) => {
      const data = callbackQuery.data;
      
      // Обработка обновления списка броней
      if (data === 'refresh_week') {
        try {
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Обновляем данные...' });
          await adminCommands.showWeeklyReservations(
            bot, 
            callbackQuery.message.chat.id, 
            callbackQuery.message.message_id
          );
        } catch (error) {
          console.error('Ошибка при обновлении:', error);
          await bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Ошибка при обновлении' });
        }
        return;
      }
      
      // Обработка изменения данных брони
      if (data === 'change_data') {
        try {
          const chatId = callbackQuery.message.chat.id;
          const context = cm.getUserContextSync(chatId);
          
          // Возвращаем пользователя к выбору даты
          cm.setUserContext(chatId, {
            ...context,
            currentStep: 'awaiting_date'
          });
          
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Изменяем данные брони...' });
          cu.sendCalendar(bot, chatId);
        } catch (error) {
          console.error('Ошибка при изменении данных:', error);
          await bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Ошибка при изменении' });
        }
        return;
      }
      
      // Обработка остальных callback-запросов
      await commands.handleCallbacks(bot, callbackQuery);
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