const { monthsRu } = require('./const');

module.exports = function(contextManager) {
  // Функция для корректного форматирования даты
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    sendCalendar: (bot, chatId) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dates = [];
        for (let i = 0; i < 20; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }

        const keyboard = dates.map(date => ({
          text: `${date.getDate()} ${monthsRu[date.getMonth()]}`,
          callback_data: `date_${formatDate(date)}`
        }));

        // Группируем по 4 кнопки в строке
        const chunkedKeyboard = [];
        for (let i = 0; i < keyboard.length; i += 4) {
          chunkedKeyboard.push(keyboard.slice(i, i + 4));
        }

        bot.sendMessage(chatId, '📅 Выберите дату:', {
          reply_markup: {
            inline_keyboard: chunkedKeyboard
          }
        });

      } catch (error) {
        console.error('Error in sendCalendar:', error);
        bot.sendMessage(chatId, '⚠️ Произошла ошибка при формировании календаря');
      }
    },
    formatDate
  };
};