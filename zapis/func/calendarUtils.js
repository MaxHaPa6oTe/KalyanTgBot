const { monthsRu } = require('./const');

module.exports = function(contextManager) {
  // Выносим formatDate в область видимости модуля
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()-1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    sendCalendar: (bot, chatId) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dates = [];
        // Генерируем 20 дней, включая сегодняшний
        for (let i = 0; i < 20; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }

        const keyboard = [];
        // Формируем клавиатуру по 4 даты в строке
        for (let i = 0; i < dates.length; i += 4) {
          const row = dates.slice(i, i + 4).map(date => ({
            text: `${date.getDate()} ${monthsRu[date.getMonth()]}`,
            callback_data: `date_${formatDate(date)}` // Используем локальную функцию
          }));
          keyboard.push(row);
        }

        // Отправляем календарь с проверкой клавиатуры
        bot.sendMessage(chatId, '📅Выберите дату:', {
          reply_markup: {
            inline_keyboard: contextManager.ensureKeyboardObjects(keyboard)
          }
        });

      } catch (error) {
        console.error('Error in sendCalendar:', error);
        bot.sendMessage(chatId, '⚠️Произошла ошибка при формировании календаря');
      }
    },
    
    // Экспортируем formatDate для использования в других модулях
    formatDate
  };
};