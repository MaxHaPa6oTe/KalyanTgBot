const { Reservation } = require('../models');
const { format } = require('date-fns');
const { ru } = require('date-fns/locale');

module.exports = {
  showUserReservations: async (bot, chatId) => {
    try {
      const reservations = await Reservation.findAll({ 
        where: { chatId },
        order: [['data', 'ASC'], ['time', 'ASC']]
      });
      
      if (reservations.length === 0) {
        await bot.sendMessage(chatId, '📭 У вас нет активных броней.');
        return;
      }
      
      // Отправляем каждую бронь отдельным сообщением с кнопкой
      for (const res of reservations) {
        const date = new Date(res.data);
        const formattedDate = format(date, 'd MMMM yyyy', { locale: ru });
        
        const message = `👤 <b>${res.ktoBron}</b>\n` +
                       `📅 <i>${formattedDate} в ${res.time}</i>\n` +
                       `👥 Гостей: ${res.kolich}`;
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '❌ Отменить бронь', 
                  callback_data: `ask_cancel_${res.id}`
                }
              ]
            ]
          }
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при загрузке броней.');
    }
  },

  askCancelConfirmation: async (bot, chatId, reservationId, messageId) => {
    try {
      const reservation = await Reservation.findOne({
        where: { 
          id: reservationId,
          chatId: chatId 
        }
      });
      
      if (!reservation) {
        return await bot.sendMessage(chatId, '❌ Бронь не найдена или уже отменена.');
      }

      const date = new Date(reservation.data);
      const formattedDate = format(date, 'd MMMM yyyy', { locale: ru });

      // Редактируем исходное сообщение вместо отправки нового
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
                { text: '❌ Нет, оставить', callback_data: `reject_cancel_${messageId}` }
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

  cancelReservation: async (bot, chatId, reservationId, originalMessageId) => {
    try {
      const deleted = await Reservation.destroy({
        where: { 
          id: reservationId,
          chatId: chatId 
        }
      });

      if (deleted) {
        await bot.deleteMessage(chatId, originalMessageId);
        await bot.sendMessage(chatId, '✅ Бронь успешно отменена!');
        
        // const { showUserReservations } = require('./commands');
        // await showUserReservations(bot, chatId);
      } else {
        await bot.sendMessage(chatId, '❌ Не удалось отменить бронь.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при отмене брони.');
    }
  },
// Команда для отображения контактов
  showContacts: async (bot, chatId) => {
    await bot.sendMessage(
      chatId,
      'ℹ️ Информация:\n\n' +
      '📍 Адрес: ул. Зоргее, д. 99, эт. 3\n' +
      '📞 Телефон: +7 (XXX) XXX-XX-XX\n' +
      '🕒 Часы работы: Пн-Вс, 10:00 - 23:00\n\n' +
      'Мы используем только премиальные сорта табака и угля'
    );
  },
}