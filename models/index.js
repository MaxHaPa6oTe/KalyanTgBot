const Reservation = require('./Reservation');

async function syncModels() {
  await Reservation.sync({ alter: true });
}

module.exports = {
  Reservation,
  syncModels,
};