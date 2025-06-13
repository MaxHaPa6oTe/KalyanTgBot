const { Op, Sequelize } = require('sequelize');
const Reservation = require('./models/Reservation');
const bot = require('./bot');
const moment = require('moment');
require('moment/locale/ru');
require('dotenv').config();

module.exports = (sequelize) => {
  return {
    startReminderService: async () => {
      console.log('🔔 Сервис напоминаний запущен.');
      
      // Отслеживание новых бронирований
      Reservation.afterCreate(async (reservation) => {
        try {
          const message = `✅ Новая бронь на ${reservation.kolich} человек\n` +
            `${moment(reservation.data).format('D MMMM YYYY')} в ${reservation.time.split(':').slice(0, 2).join(':')}\n`;
          await bot.sendMessage(process.env.TG_ID, message);
          // console.log(`Уведомление о новой брони отправлено админу`);
        } catch (error) {
          console.error('Ошибка при отправке уведомления о новой брони:', error);
        }
      });

      // Оригинальный код с напоминаниями
      setInterval(async () => {
        try {
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 30 * 60 * 1000);
          const currentDate = moment(now).format('YYYY-MM-DD');
          const timePlus1Hour = moment(oneHourLater).format('HH:mm');

          const reservations = await Reservation.findAll({
            where: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn('date', sequelize.col('data')),
                  currentDate
                ),
                {
                  time: timePlus1Hour
                }
              ]
            }
          });

          for (const reservation of reservations) {
            try {
              const message = `🔔 Через 30 мин к вам придут посетители!\n\n` +
                `<b>Столик забранировал ${reservation.ktoBron} на ${reservation.kolich} человек,</b>\n` +
                `номер для связи: ${reservation.phoneNumber}`;
              await bot.sendMessage(process.env.ADMIN_CHAT_ID, message);
            } catch (error) {
              console.error('❌ Ошибка отправки:', error.message);
            }
          }
        } catch (error) {
          console.error('🔥 Ошибка в сервисе напоминаний:', error);
        }
      }, 1 * 60 * 1000);
    }
  };
};