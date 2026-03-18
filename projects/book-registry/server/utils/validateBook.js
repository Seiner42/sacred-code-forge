function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateBook(input) {
  const title = String(input.title || '').trim();
  const author = String(input.author || '').trim();
  const comment = String(input.comment || '').trim();
  const rating = Number(input.rating);
  const finishedAt = String(input.finishedAt || '').trim();

  if (!title) {
    return 'Поле title обязательно.';
  }

  if (!author) {
    return 'Поле author обязательно.';
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return 'Поле rating должно быть целым числом от 1 до 10.';
  }

  if (!isIsoDate(finishedAt)) {
    return 'Поле finishedAt должно быть в формате YYYY-MM-DD.';
  }

  return null;
}

module.exports = {
  validateBook,
};
