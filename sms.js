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
    
    setInterval(async () => {
      try {
        const now = new Date();
        // console.log(`⏱ Проверка напоминаний в ${now.toLocaleString()}`);
        
        // Напоминание за 1 час и 10 минут
        const oneHourLater = new Date(now.getTime() + 30 * 60 * 1000);
        // const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

        // Форматируем даты и времена
        const currentDate = moment(now).format('YYYY-MM-DD');
        const timePlus1Hour = moment(oneHourLater).format('HH:mm');
        // const timePlus10Min = moment(tenMinutesLater).format('HH:mm');

        // console.log('🔍 Ищем брони на:', {
        //   date: currentDate,
        //   times: [timePlus1Hour]
        // });

        // Правильный запрос для PostgreSQL
        const reservations = await Reservation.findAll({
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn('date', sequelize.col('data')),
                currentDate
              ),
              {
                time: {
                  [Op.or]: [
                  
                    timePlus1Hour
                  ]
                }
              }
            ]
          }
        });

        // console.log(`📊 Найдено броней для напоминания: ${reservations.length}`);

        // Отправка напоминаний
        for (const reservation of reservations) {
          try {
            const message = `🔔 Через 30 мин к вам придут посетители!\n\n` +
              `Столик забранировал ${reservation.ktoBron} на ${reservation.kolich} человек`
              await bot.sendMessage(process.env.TG_ID, message);
            // console.log(`✉️ Напоминание отправлено для ${reservation.ktoBron} (${reservation.chatId})`);
          } catch (error) {
            console.error('❌ Ошибка отправки:', error.message);
          }
        }
      } catch (error) {
        console.error('🔥 Ошибка в сервисе напоминаний:', error);
      }
    }, 1 * 60 * 1000); // Проверка каждые 2 минуты
  }}
};