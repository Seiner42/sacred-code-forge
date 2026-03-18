const express = require('express');
const crypto = require('crypto');
const { readBooks, writeBooks } = require('../storage/books');
const { validateBook } = require('../utils/validateBook');

function createBooksRouter() {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      const books = await readBooks();
      books.sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
      res.json({ books });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const validationError = validateBook(req.body || {});
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const books = await readBooks();
      const book = {
        id: crypto.randomUUID(),
        title: String(req.body.title).trim(),
        author: String(req.body.author).trim(),
        rating: Number(req.body.rating),
        finishedAt: String(req.body.finishedAt).trim(),
        comment: String(req.body.comment || '').trim(),
      };

      books.push(book);
      await writeBooks(books);

      return res.status(201).json({ book });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createBooksRouter,
};
