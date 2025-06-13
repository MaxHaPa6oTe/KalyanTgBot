const forbiddenWords = ['хуй', 'пизда'];

function validateName(name) {
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

  function validatePhone(phone) {
  // Простая валидация российских номеров
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (!cleaned) {
    return { valid: false, reason: 'Номер телефона не может быть пустым' };
  }
  
  if (!/^(\+7|8|7)[\d]{10}$/.test(cleaned)) {
    return { valid: false, reason: 'Некорректный российский номер телефона' };
  }
  
  // Форматируем номер для единообразия
  const formatted = '+7' + cleaned.slice(-10);
  return { valid: true, formatted };
}

module.exports = { validateName, validatePhone };