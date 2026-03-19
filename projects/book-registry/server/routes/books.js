const express = require('express');
const crypto = require('crypto');
const { readBooks, writeBooks } = require('../storage/books');
const { validateBook } = require('../utils/validateBook');

const ALLOWED_PAGE_SIZES = new Set([10, 25, 50, 100]);

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

function getPagination(query) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawPageSize = Number.parseInt(query.pageSize, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = ALLOWED_PAGE_SIZES.has(rawPageSize) ? rawPageSize : 10;

  return { page, pageSize };
}

function sortBooks(books) {
  return books.sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLocaleLowerCase('ru-RU');
}

function filterBooks(books, query) {
  const titleQuery = normalizeSearchValue(query.title);
  const authorQuery = normalizeSearchValue(query.author);

  return books.filter((book) => {
    const titleMatches = !titleQuery || String(book.title || '').toLocaleLowerCase('ru-RU').includes(titleQuery);
    const authorMatches = !authorQuery || String(book.author || '').toLocaleLowerCase('ru-RU').includes(authorQuery);
    return titleMatches && authorMatches;
  });
}

function buildStats(books) {
  const totalBooks = books.length;
  const averageRating = totalBooks === 0
    ? null
    : Number((books.reduce((sum, book) => sum + Number(book.rating || 0), 0) / totalBooks).toFixed(1));

  const sortedBooks = [...books].sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
  const latestFinishedAt = sortedBooks[0]?.finishedAt || null;
  const currentYear = new Date().getUTCFullYear();
  const booksThisYear = books.filter((book) => String(book.finishedAt || '').startsWith(`${currentYear}-`)).length;

  return {
    totalBooks,
    averageRating,
    latestFinishedAt,
    booksThisYear,
  };
}

function createBooksRouter() {
  const router = express.Router();

  router.get('/stats', async (_req, res, next) => {
    try {
      const books = await readBooks();
      res.json({ stats: buildStats(books) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const allBooks = await readBooks();
      const filteredBooks = sortBooks(filterBooks(allBooks, req.query));

      const { page, pageSize } = getPagination(req.query);
      const totalItems = filteredBooks.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIndex = (safePage - 1) * pageSize;
      const pagedBooks = filteredBooks.slice(startIndex, startIndex + pageSize);

      res.json({
        books: pagedBooks,
        pagination: {
          page: safePage,
          pageSize,
          totalItems,
          totalPages,
        },
        filters: {
          title: String(req.query.title || ''),
          author: String(req.query.author || ''),
        },
      });
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
