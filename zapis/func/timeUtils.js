module.exports = function(contextManager) {
  // Генерация слотов времени с учетом текущего времени
  function generateTimeSlots(selectedDate) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 33);
    const times = [];
    
    // Проверяем, выбрана ли сегодняшняя дата
    const isToday = selectedDate && 
                   new Date(selectedDate).toDateString() === now.toDateString();

    for (let h = 10; h < 23; h++) {
      for (let m = 0; m < 60; m += 20) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        // Если выбрана не сегодняшняя дата или время еще не прошло
        if (!isToday || 
            h > now.getHours() || 
            (h === now.getHours() && m >= now.getMinutes())) {
          times.push(timeStr);
        }
      }
    }
    return times;
  }

  return {
    promptForTime: (bot, chatId) => {
      // Получаем выбранную дату из контекста
      const context = contextManager.getUserContext(chatId);
      const selectedDate = context ? context.date : null;
      
      const times = generateTimeSlots(selectedDate);
      
      // Если нет доступных слотов на сегодня
      if (times.length === 0 && selectedDate && 
          new Date(selectedDate).toDateString() === new Date().toDateString()) {
        return bot.sendMessage(chatId, '⌛ На сегодня все доступные временные слоты уже прошли. Пожалуйста, выберите другую дату.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Выбрать другую дату', callback_data: 'change_date' }]
            ]
          }
        });
      }

      const keyboard = [];
      for (let i = 0; i < times.length; i += 4) {
        keyboard.push(
          times.slice(i, i + 4).map(time => ({
            text: time,
            callback_data: `time_${time}`
          }))
        );
      }

      bot.sendMessage(chatId, '⏰ Пожалуйста, выберите время:', {
        reply_markup: { inline_keyboard: contextManager.ensureKeyboardObjects(keyboard) }
      });
    }
  };
};