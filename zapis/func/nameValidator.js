const forbiddenWords = ['хуй', 'пизда'];

module.exports = {
  validateName: (name) => {
    // Проверка длины
    if (name.length > 14 || name.length < 2) {
      return { valid: false, reason: 'Несуществующее имя' };
    }

    // Проверка на спецсимволы
    if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(name)) {
      return { valid: false, reason: 'Имя содержит недопустимые символы' };
    }

    // Проверка на запрещенные слова
    const lowerName = name.toLowerCase();
    if (forbiddenWords.some(word => lowerName.includes(word))) {
      return { valid: false, reason: 'Имя содержит недопустимые слова' };
    }

    return { valid: true };
  }
};