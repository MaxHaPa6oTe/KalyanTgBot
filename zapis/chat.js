const { validateName } = require('./func/nameValidator');
const { monthsRu } = require('./func/const');
const fs = require('fs');
const path = require('path');
const guestHandler = require('./func/guestHandler')();

module.exports = function(bot, contextManager, calendarUtils, timeUtils) {
  // Функция для отправки приветственного изображения
  const sendWelcomeImage = async (chatId) => {
    try {
      const imagePath = path.join(__dirname, './kalyan.jpg');
      if (fs.existsSync(imagePath)) {
        await bot.sendPhoto(chatId, fs.readFileSync(imagePath), {
          caption: 'Приветствуем в нашей кальянной! 🍏💨 Хотите забронировать столи?',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Да', callback_data: 'make_reservation' }]
            ]
          }
        });
      } else {
        await bot.sendMessage(chatId, 'Приветствуем в нашей кальянной! 🍏💨 Хотите забранировать столик?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Да', callback_data: 'make_reservation' }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при отправке изображения:', error);
    }
  };

  // Обработчик текстовых сообщений
  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const context = contextManager.getUserContextSync(chatId);
    
    // Обработка ввода имени
    if (context?.currentStep === 'awaiting_name') {
      const name = msg.text.trim();
      const validation = validateName(name);
      
      if (!validation.valid) {
        bot.sendMessage(chatId, `Ошибка: ${validation.reason}\nПожалуйста, введите имя еще раз:`);
        return;
      }
      
      contextManager.setUserContext(chatId, { 
        ...context, 
        clientName: name,
        currentStep: 'awaiting_date' 
      });
      calendarUtils.sendCalendar(bot, chatId);
    }
  });

  // Обработчик callback запросов
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const context = contextManager.getUserContextSync(chatId);

    try {
      if (data === 'make_reservation') {
        await bot.sendMessage(chatId, '👤 На чье имя сделать бронь?');
        contextManager.setUserContext(chatId, { 
          currentStep: 'awaiting_name'
        });
      }
      else if (data.startsWith('date_')) {
        const dateStr = data.slice(5);
          const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + 1);
  // Форматируем для базы (YYYY-MM-DD)
  const dbDate = dateObj.toISOString().split('T')[0];

        contextManager.setUserContext(chatId, { 
          ...context, 
          date: dbDate,
          currentStep: 'awaiting_time' 
        });
        timeUtils.promptForTime(bot, chatId);
      }
      else if (data === 'change_date') {
        calendarUtils.sendCalendar(bot, chatId);
      }
      else if (data === 'choose_time') {
        timeUtils.promptForTime(bot, chatId);
      }
      else if (data.startsWith('time_')) {
        const time = data.slice(5);
        contextManager.setUserContext(chatId, { 
          ...context, 
          time,
          currentStep: 'awaiting_guests' 
        });
        guestHandler.askForGuestsCount(bot, chatId);
      }
      else if (data.startsWith('guests_')) {
        const guestsCount = data.split('_')[1];
        const updatedContext = {
          ...context,
          guests: guestsCount,
          currentStep: 'confirmation'
        };
        contextManager.setUserContext(chatId, updatedContext);
        
        // Показываем подтверждение с всеми данными
        const dateObj = new Date(updatedContext.date);
        const guestsText = guestHandler.getGuestsText(guestsCount);
        
        await bot.sendMessage(chatId, 
          `Проверьте данные брони:\n\n` +
          `👤 Имя: ${updatedContext.clientName}\n` +
          `📅 Дата: ${dateObj.getDate()} ${monthsRu[dateObj.getMonth()]} ${dateObj.getFullYear()}\n` +
          `⏰ Время: ${updatedContext.time}\n` +
          `👥 Количество гостей: ${guestsText}\n` +
          `📍 Адрес: ул. Зоргее, д. 99, эт. 3`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Подтвердить', callback_data: 'confirm' }],
                [{ text: 'Изменить данные', callback_data: 'change_data' }]
              ]
            }
          }
        );
      }
      else if (data === 'confirm') {
  const context = contextManager.getUserContext(chatId);
  if (!context?.clientName || !context.date || !context.time || !context.guests) {
    throw new Error('Не все данные заполнены');
  }

  const dateObj = new Date(context.date);
  const guestsText = guestHandler.getGuestsText(context.guests);
  
  try {
    // Преобразуем guests в число (например, '2' -> 2)
    const guestsCount = parseInt(context.guests) || 2; // 2 по умолчанию
    // Сохраняем в базу данных
    const Reservation = require('../models/Reservation');
    await Reservation.create({
    ktoBron: context.clientName,
    data: context.date,
    time: context.time,
    kolich: parseInt(context.guests) || 2,
    chatId: chatId // Добавляем ID чата
  });

    await bot.sendMessage(
      chatId,
      '✅ Столик забронирован '
    );
    
  } catch (dbError) {
    console.error('Ошибка сохранения в БД:', dbError);
    await bot.sendMessage(chatId, '⚠️ Ошибка при сохранении брони. Пожалуйста, попробуйте снова.');
  } finally {
    contextManager.clearUserContext(chatId);
  }
}
      else if (data === 'cancel') {
        contextManager.clearUserContext(chatId);
        sendWelcomeImage(chatId);
      }
      else if (data === 'change_data') {
        contextManager.setUserContext(chatId, { 
          ...context,
          currentStep: 'awaiting_name' 
        });
        bot.sendMessage(chatId, 'Введите имя заново:');
      }
    } catch (error) {
      console.error('Ошибка обработки:', error);
      bot.sendMessage(chatId, '⚠️ Произошла ошибка, попробуйте снова');
    }

    bot.answerCallbackQuery(callbackQuery.id);
  });

  return {
    sendWelcomeImage,
    start: (chatId) => {
      sendWelcomeImage(chatId);
    }
  };
};