const express = require('express');
const crypto = require('crypto');
const { readBooks, writeBooks } = require('../storage/books');
const { validateBook } = require('../utils/validateBook');

function normalizeBookPayload(payload, id) {
  return {
    id,
    title: String(payload.title).trim(),
    author: String(payload.author).trim(),
    rating: Number(payload.rating),
    finishedAt: String(payload.finishedAt).trim(),
    comment: String(payload.comment || '').trim(),
  };
}

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
      const book = normalizeBookPayload(req.body, crypto.randomUUID());

      books.push(book);
      await writeBooks(books);

      return res.status(201).json({ book });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const validationError = validateBook(req.body || {});
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const books = await readBooks();
      const index = books.findIndex((book) => book.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: 'Книга не найдена.' });
      }

      const updatedBook = normalizeBookPayload(req.body, books[index].id);
      books[index] = updatedBook;
      await writeBooks(books);

      return res.json({ book: updatedBook });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const books = await readBooks();
      const filteredBooks = books.filter((book) => book.id !== req.params.id);

      if (filteredBooks.length === books.length) {
        return res.status(404).json({ error: 'Книга не найдена.' });
      }

      await writeBooks(filteredBooks);
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createBooksRouter,
};
