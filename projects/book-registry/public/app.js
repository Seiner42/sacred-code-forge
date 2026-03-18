const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const bookForm = document.getElementById('book-form');
const booksList = document.getElementById('books-list');
const booksEmpty = document.getElementById('books-empty');
const loginError = document.getElementById('login-error');
const bookError = document.getElementById('book-error');
const refreshButton = document.getElementById('refresh-button');
const logoutButton = document.getElementById('logout-button');

function showLogin() {
  loginView.classList.remove('hidden');
  appView.classList.add('hidden');
}

function showApp() {
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
}

function setError(node, message) {
  node.textContent = message;
  node.classList.toggle('hidden', !message);
}

function renderBooks(books) {
  booksList.innerHTML = '';
  booksEmpty.classList.toggle('hidden', books.length > 0);

  books.forEach((book) => {
    const item = document.createElement('article');
    item.className = 'book-item';
    item.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <div class="book-meta">
        <span>Автор: ${escapeHtml(book.author)}</span>
        <span>Оценка: ${escapeHtml(String(book.rating))}/10</span>
        <span>Прочитано: ${escapeHtml(book.finishedAt)}</span>
      </div>
      <p>${escapeHtml(book.comment || '—')}</p>
    `;
    booksList.appendChild(item);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error || 'Запрос завершился ошибкой.';
    throw new Error(message);
  }

  return data;
}

async function loadBooks() {
  const data = await api('/api/books');
  renderBooks(data.books || []);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(loginError, '');
  const password = new FormData(loginForm).get('password');

  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    loginForm.reset();
    showApp();
    await loadBooks();
  } catch (error) {
    setError(loginError, error.message);
  }
});

bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(bookError, '');
  const formData = new FormData(bookForm);
  const payload = Object.fromEntries(formData.entries());
  payload.rating = Number(payload.rating);

  try {
    await api('/api/books', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    bookForm.reset();
    await loadBooks();
  } catch (error) {
    setError(bookError, error.message);
  }
});

refreshButton.addEventListener('click', async () => {
  try {
    await loadBooks();
  } catch (error) {
    setError(bookError, error.message);
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await api('/api/logout', { method: 'POST' });
  } finally {
    showLogin();
  }
});

(async function init() {
  try {
    await loadBooks();
    showApp();
  } catch {
    showLogin();
  }
})();
