// ./zapis/func/contextManager.js
module.exports = function(userContexts) {
  return {
    // Для получения контекста
    getUserContext: (userId) => {
      return userContexts[userId] || {};
    },
    
    // Синхронная версия (если нужно)
    getUserContextSync: (userId) => {
      return userContexts[userId] || {};
    },
    
    // Для установки контекста
    setUserContext: (userId, data) => {
      userContexts[userId] = data;
    },
    
    // Для очистки контекста
    clearUserContext: (userId) => {
      delete userContexts[userId];
    },
    
    // Для проверки клавиатуры
    ensureKeyboardObjects: (keyboard) => {
      return keyboard.map(row =>
        row.map(button => {
          if (typeof button !== 'object' || button === null || !button.text || !button.callback_data) {
            return { text: 'Ошибка', callback_data: 'error' };
          }
          return button;
        })
      );
    },
    
    // Для форматирования даты
    formatDateISO: (date) => {
      return date.toISOString().slice(0, 10);
    }
  };
};