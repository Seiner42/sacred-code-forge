const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { ensureBooksFile } = require('./storage/books');
const { createAuthRouter } = require('./routes/auth');
const { createBooksRouter } = require('./routes/books');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const cookieName = process.env.SESSION_COOKIE_NAME || 'book_registry_session';
const sessionToken = process.env.SESSION_TOKEN || 'dev-session-token';
const appPassword = process.env.APP_PASSWORD || '';
const secureCookie = process.env.NODE_ENV === 'production';

function requireSession(req, res, next) {
  if (req.cookies?.[cookieName] !== sessionToken) {
    return res.status(401).json({ error: 'Требуется авторизация.' });
  }

  return next();
}

app.use(express.json());
app.use(cookieParser());
app.use('/api', createAuthRouter({ appPassword, cookieName, sessionToken, secureCookie }));
app.use('/api/books', requireSession, createBooksRouter());
app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

ensureBooksFile()
  .then(() => {
    app.listen(port, () => {
      console.log(`Book Registry listening on http://0.0.0.0:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to prepare books storage:', error);
    process.exit(1);
  });
