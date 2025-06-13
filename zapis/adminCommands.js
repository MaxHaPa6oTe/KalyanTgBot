const { Reservation } = require('../models');
const { format, startOfWeek, endOfWeek } = require('date-fns');
const { ru } = require('date-fns/locale');
const Sequelize = require('sequelize');

module.exports = {
  showWeeklyReservations: async (bot, chatId) => {
    try {
      const weekStart = startOfWeek(new Date(), { locale: ru });
      const weekEnd = endOfWeek(new Date(), { locale: ru });

      const reservations = await Reservation.findAll({
        where: {
          data: {
            [Sequelize.Op.between]: [
              format(weekStart, 'yyyy-MM-dd'),
              format(weekEnd, 'yyyy-MM-dd')
            ]
          }
        },
        order: [['data', 'ASC'], ['time', 'ASC']]
      });

      if (reservations.length === 0) {
        return await bot.sendMessage(chatId, 'На этой неделе броней нет.');
      }

      let message = '📅 Брони на текущую неделю:\n\n';
      let currentDate = null;

      reservations.forEach(res => {
        const date = new Date(res.data);
        const formattedDate = format(date, 'EEEE, d MMMM', { locale: ru });
        
        if (formattedDate !== currentDate) {
          message += `\n📌 <b>${formattedDate}</b>\n`;
          currentDate = formattedDate;
        }

        message += `⏰ ${res.time} - ${res.ktoBron} (${res.kolich} чел.)\n` +
                   `📞 ${res.phoneNumber || 'нет телефона'}\n\n`;
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
      await bot.sendMessage(chatId, '⚠️ Ошибка при загрузке броней на неделю.');
    }
  }
};