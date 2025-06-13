const { Reservation } = require('../models');
const { format, isAfter } = require('date-fns');
const { ru } = require('date-fns/locale');

const commands = {
  // Показ броней пользователя
  showUserReservations: async (bot, chatId) => {
    try {
      const now = new Date();
      const reservations = await Reservation.findAll({ 
        where: { chatId },
        order: [['data', 'ASC'], ['time', 'ASC']]
      });
      
      if (reservations.length === 0) {
        await bot.sendMessage(chatId, '📭 У вас нет активных броней.');
        return;
      }
      
      let hasActiveReservations = false;

      for (const res of reservations) {
        const reservationDate = new Date(res.data);
        const [hours, minutes] = res.time.split(':');
        reservationDate.setHours(hours, minutes);
        
        if (isAfter(now, reservationDate)) continue;

        hasActiveReservations = true;
        const formattedDate = format(reservationDate, 'd MMMM yyyy', { locale: ru });
        
        await bot.sendMessage(chatId, 
          `👤 <b>${res.ktoBron}</b>\n` +
          `📞 <b>Телефон: ${res.phoneNumber}</b>\n` +
          `📅 <i>${formattedDate} в ${res.time}</i>\n` +
          `👥 Гостей: ${res.kolich}`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отменить бронь', callback_data: `ask_cancel_${res.id}` }]
              ]
            }
          }
        );
      }

      if (!hasActiveReservations) {
        await bot.sendMessage(chatId, '📭 У вас нет активных броней (все брони уже прошли).');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при загрузке броней.');
    }
  },

  // Запрос подтверждения отмены
  askCancelConfirmation: async (bot, chatId, reservationId, messageId) => {
    try {
      const reservation = await Reservation.findOne({
        where: { id: reservationId, chatId }
      });
      
      if (!reservation) {
        return await bot.sendMessage(chatId, '❌ Бронь не найдена или уже отменена.');
      }

      const date = new Date(reservation.data);
      const formattedDate = format(date, 'd MMMM yyyy', { locale: ru });

      await bot.editMessageText(
        `Вы уверены, что хотите отменить эту бронь?\n\n` +
        `👤 ${reservation.ktoBron}\n` +
        `📅 ${formattedDate} в ${reservation.time}\n` +
        `👥 ${reservation.kolich} гостей`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Да, отменить', callback_data: `confirm_cancel_${reservationId}` },
                { text: '❌ Нет, оставить', callback_data: `keep_${reservationId}_${messageId}` }
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при подтверждении.');
    }
  },

  // Отмена бронирования
  cancelReservation: async (bot, chatId, reservationId, messageId) => {
    try {
      const deleted = await Reservation.destroy({
        where: { id: reservationId, chatId }
      });

      if (deleted) {
        await bot.deleteMessage(chatId, messageId);
        await bot.sendMessage(chatId, '✅ Бронь успешно отменена!');
      } else {
        await bot.sendMessage(chatId, '❌ Не удалось отменить бронь.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при отмене брони.');
    }
  },

  // Сохранение брони
  keepReservation: async (bot, chatId, reservationId, messageId) => {
    try {
      const reservation = await Reservation.findOne({
        where: { id: reservationId, chatId }
      });

      if (!reservation) return;

      const date = new Date(reservation.data);
      const formattedDate = format(date, 'd MMMM yyyy', { locale: ru });

      await bot.editMessageText(
        `👤 <b>${reservation.ktoBron}</b>\n` +
        `📞 <b>${reservation.phoneNumber}</b>\n` +
        `📅 <i>${formattedDate} в ${reservation.time}</i>\n` +
        `👥 Гостей: ${reservation.kolich}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ Отменить бронь', callback_data: `ask_cancel_${reservationId}` }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка:', error);
    }
  },

  // Показ контактов
  showContacts: async (bot, chatId) => {
    await bot.sendMessage(
      chatId,
      'ℹ️ Информация:\n\n' +
      '📍 Адрес: г.Казань, тц.Олимп, эт.3\n' +
      '📞 Телефон: +7 (986) 910-35-45\n' +
      '🕒 Часы работы: Пн-Вс, 10:00 - 23:00\n\n' +
      'Мы используем только премиальные сорта табака и угля'
    );
  }
};

// Обработчик callback-запросов
const handleCallbacks = async (bot, callbackQuery) => {
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
    else if (data.startsWith('keep_')) {
      const parts = data.split('_');
      const reservationId = parts[1];
      await commands.keepReservation(bot, chatId, reservationId, messageId);
    }
  } catch (error) {
    console.error('Ошибка обработки callback:', error);
  } finally {
    bot.answerCallbackQuery(callbackQuery.id);
  }
};

module.exports = {
  ...commands,
  handleCallbacks
};