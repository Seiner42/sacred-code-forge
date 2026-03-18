const express = require('express');

function createAuthRouter({ appPassword, cookieName, sessionToken, secureCookie }) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const password = String(req.body?.password || '');

    if (!appPassword) {
      return res.status(500).json({ error: 'APP_PASSWORD is not configured.' });
    }

    if (password !== appPassword) {
      return res.status(401).json({ error: 'Неверный пароль.' });
    }

    res.cookie(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: secureCookie,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({ ok: true });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'strict',
      secure: secureCookie,
      path: '/',
    });

    return res.json({ ok: true });
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
