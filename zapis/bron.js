// zapis/bron.js

require('dotenv').config();

async function makeReservation({ chatId, date, time }) {
  const { Sequelize } = require('sequelize');
  const sequelize = new Sequelize(process.env.DB_URL);

  // Предполагается наличие модели Reservation
  const { Reservation, User } = require('../models');

  try {
    const dateTimeStr = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeStr);

    let userRecord = await User.findOne({ where: { telegramId: chatId.toString() } });
    if (!userRecord) {
      userRecord = await User.create({ telegramId: chatId.toString() });
    }

    await Reservation.create({
      dateTime,
      userTelegramId: chatId.toString(),
      userId: userRecord.id,
    });
    
    console.log(`Бронирование успешно создано для чата ${chatId} на ${date} ${time}`);
    
  } catch (err) {
    console.error('Ошибка при создании брони:', err);
  }
}

module.exports = { makeReservation };