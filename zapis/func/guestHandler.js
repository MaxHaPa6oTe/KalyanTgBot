// func/guestHandler.js
module.exports = function() {
  return {
    askForGuestsCount: (bot, chatId) => {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '1-2 человека', callback_data: 'guests_2' }],
            [{ text: '3-4 человека', callback_data: 'guests_4' }],
            [{ text: '5-6 человек', callback_data: 'guests_6' }],
            [{ text: 'Больше 6 человек', callback_data: 'guests_10' }]
          ]
        }
      };
      return bot.sendMessage(chatId, '👥Укажите количество гостей:', options);
    },

    getGuestsText: (code) => {
      const map = {
        '2': '1-2 человека',
        '4': '3-4 человека',
        '6': '5-6 человек',
        '10': 'Больше 6 человек'
      };
      return map[code] || code;
    }
  };
};