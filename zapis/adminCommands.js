const { Reservation } = require('../models');
const { format, addDays } = require('date-fns');
const { ru } = require('date-fns/locale');
const Sequelize = require('sequelize');

module.exports = {
  showWeeklyReservations: async (bot, chatId) => {
    try {
      const today = new Date();
      const sevenDaysLater = addDays(today, 7); // Получаем дату через 7 дней

      const reservations = await Reservation.findAll({
        where: {
          data: {
            [Sequelize.Op.between]: [
              format(today, 'yyyy-MM-dd'),
              format(sevenDaysLater, 'yyyy-MM-dd')
            ]
          }
        },
        order: [['data', 'ASC'], ['time', 'ASC']]
      });

      if (reservations.length === 0) {
        return await bot.sendMessage(chatId, 'На ближайшие 7 дней броней нет.');
      }

      let message = '📅 Брони на ближайшие 7 дней:\n\n';
      let currentDate = null;

      reservations.forEach(res => {
        const date = new Date(res.data);
        const formattedDate = format(date, 'EEEE, d MMMM', { locale: ru });
        
        if (formattedDate !== currentDate) {
          message += `\n📌 <b>${formattedDate}</b>\n`;
          currentDate = formattedDate;
        }

        message += `\n👤 <b>${res.ktoBron}</b>\n` +
                   `📞 <b>Телефон: ${res.phoneNumber}</b>\n` +
                   `⏰ <i>${res.time}</i>\n` +
                   `👥 Гостей: ${res.kolich}\n`;
      });

      await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить', callback_data: 'refresh_week' }]
          ]
        }
      });
    } catch (error) {
      console.error('Ошибка при получении броней:', error);
      await bot.sendMessage(chatId, '⚠️ Ошибка при загрузке броней.');
    }
  }
};