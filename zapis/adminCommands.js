// В файле adminCommands.js
const { Reservation } = require('../models');
const { format, addDays, isSameDay, parseISO, isAfter } = require('date-fns');
const { ru } = require('date-fns/locale');
const Sequelize = require('sequelize');
const crypto = require('crypto');

const messageHashes = new Map();

// Функция для проверки, актуальна ли бронь
const isReservationActive = (reservation) => {
  const now = new Date();
  const reservationDate = parseISO(reservation.data);
  
  // Разбираем время брони (формат HH:mm или HH:mm:ss)
  const [hours, minutes] = reservation.time.split(':').map(Number);
  reservationDate.setHours(hours, minutes, 0, 0);
  
  // Проверяем, что дата/время брони еще не прошли
  return isAfter(reservationDate, now);
};

module.exports = {
  showWeeklyReservations: async (bot, chatId, messageId = null, callbackQuery = null) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const sevenDaysLater = addDays(todayStart, 7);

      // Получаем и фильтруем бронирования
      const allReservations = await Reservation.findAll({
        where: {
          data: {
            [Sequelize.Op.between]: [
              format(todayStart, 'yyyy-MM-dd'),
              format(sevenDaysLater, 'yyyy-MM-dd')
            ]
          }
        },
        order: [['data', 'ASC'], ['time', 'ASC']]
      });

      // Фильтруем прошедшие брони
      const activeReservations = allReservations.filter(isReservationActive);

      // Формируем сообщение
      let message = '📅 Брони на ближайшие 7 дней:\n\n';
      let currentDate = null;

      if (activeReservations.length === 0) {
        message = 'На ближайшие 7 дней активных броней нет.';
      } else {
        activeReservations.forEach(res => {
          const date = parseISO(res.data);
          const formattedDate = format(date, 'EEEE, d MMMM', { locale: ru });
          
          if (!currentDate || !isSameDay(currentDate, date)) {
            message += `\n📌 <b>${formattedDate}</b>\n`;
            currentDate = date;
          }

          message += `\n👤 <b>${res.ktoBron}</b>\n` +
                     `📞 <b>${res.phoneNumber}</b>\n` +
                     `⏰ <i>${res.time.split(':').slice(0, 2).join(':')}</i>\n` +
                     `👥 Гостей: ${res.kolich}\n`;
        });
      }

      // Остальной код без изменений...
      const messageHash = crypto.createHash('md5').update(message).digest('hex');
      const replyMarkup = {
        inline_keyboard: [[{ text: '🔄 Обновить', callback_data: 'refresh_week' }]]
      };

      const previousHash = messageHashes.get(messageId);
      if (previousHash === messageHash && messageId) {
        if (callbackQuery) {
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Данные актуальны' });
        }
        return;
      }

      messageHashes.set(messageId, messageHash);

      if (messageId) {
        try {
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
          });
        } catch (error) {
          if (error.code === 400 && error.response?.description?.includes('message is not modified')) {
            if (callbackQuery) {
              await bot.answerCallbackQuery(callbackQuery.id, { text: 'Данные не изменились' });
            }
            return;
          }
          throw error;
        }
      } else {
        const sentMessage = await bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        });
        messageHashes.set(sentMessage.message_id, messageHash);
      }

      if (callbackQuery) {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      if (callbackQuery) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Ошибка при обновлении' });
      }
      await bot.sendMessage(chatId, '⚠️ Произошла ошибка при обновлении данных');
    }
  }
};