const fs = require('fs/promises');
const path = require('path');

const dataDir = path.resolve(__dirname, '../../data');
const booksPath = path.join(dataDir, 'books.json');

async function ensureBooksFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(booksPath);
  } catch {
    await fs.writeFile(booksPath, JSON.stringify({ books: [] }, null, 2) + '\n', 'utf8');
  }
}

async function readBooks() {
  await ensureBooksFile();
  const raw = await fs.readFile(booksPath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.books) ? parsed.books : [];
}

async function writeBooks(books) {
  await ensureBooksFile();
  await fs.writeFile(booksPath, JSON.stringify({ books }, null, 2) + '\n', 'utf8');
}

module.exports = {
  booksPath,
  readBooks,
  writeBooks,
  ensureBooksFile,
};
