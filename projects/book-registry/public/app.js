const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const bookForm = document.getElementById('book-form');
const formPanel = document.getElementById('form-panel');
const toggleFormButton = document.getElementById('toggle-form-button');
const booksList = document.getElementById('books-list');
const booksEmpty = document.getElementById('books-empty');
const loginError = document.getElementById('login-error');
const bookError = document.getElementById('book-error');
const refreshButton = document.getElementById('refresh-button');
const logoutButton = document.getElementById('logout-button');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const bookFormTitle = document.getElementById('book-form-title');
const pageSizeSelect = document.getElementById('page-size-select');
const paginationSummary = document.getElementById('pagination-summary');
const paginationControls = document.getElementById('pagination-controls');
const pageIndicator = document.getElementById('page-indicator');
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const statTotalBooks = document.getElementById('stat-total-books');
const statAverageRating = document.getElementById('stat-average-rating');
const statLatestFinished = document.getElementById('stat-latest-finished');
const statBooksThisYear = document.getElementById('stat-books-this-year');

let editingBookId = null;
let isFormOpen = false;
let currentPage = 1;
let currentPageSize = Number(pageSizeSelect.value);
let currentPagination = {
  page: 1,
  pageSize: currentPageSize,
  totalItems: 0,
  totalPages: 1,
};

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

function updatePaginationUi() {
  const { page, pageSize, totalItems, totalPages } = currentPagination;
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  paginationSummary.textContent = `Показано ${start}–${end} из ${totalItems}`;
  pageIndicator.textContent = `Страница ${page} из ${totalPages}`;
  prevPageButton.disabled = page <= 1;
  nextPageButton.disabled = page >= totalPages;
  paginationControls.classList.toggle('hidden', totalItems === 0);
}

function renderStats(stats) {
  statTotalBooks.textContent = stats.totalBooks ?? '—';
  statAverageRating.textContent = stats.averageRating ?? '—';
  statLatestFinished.textContent = stats.latestFinishedAt || '—';
  statBooksThisYear.textContent = stats.booksThisYear ?? '—';
}

function openForm() {
  isFormOpen = true;
  formPanel.classList.remove('hidden');
  toggleFormButton.textContent = editingBookId ? 'Форма открыта' : 'Скрыть форму';
}

function closeForm() {
  isFormOpen = false;
  formPanel.classList.add('hidden');
  toggleFormButton.textContent = 'Добавить книгу';
}

function resetBookForm({ keepOpen = false } = {}) {
  editingBookId = null;
  bookForm.reset();
  bookFormTitle.textContent = 'Добавить книгу';
  submitButton.textContent = 'Сохранить запись';
  cancelEditButton.textContent = 'Закрыть';
  setError(bookError, '');

  if (keepOpen) {
    openForm();
  } else {
    closeForm();
  }
}

function startEditing(book) {
  editingBookId = book.id;
  bookForm.title.value = book.title;
  bookForm.author.value = book.author;
  bookForm.rating.value = book.rating;
  bookForm.finishedAt.value = book.finishedAt;
  bookForm.comment.value = book.comment || '';
  bookFormTitle.textContent = 'Изменить книгу';
  submitButton.textContent = 'Сохранить изменения';
  cancelEditButton.textContent = 'Отмена';
  setError(bookError, '');
  openForm();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div class="book-actions">
        <button type="button" class="secondary small" data-action="edit">Изменить</button>
        <button type="button" class="danger small" data-action="delete">Удалить</button>
      </div>
    `;

    item.querySelector('[data-action="edit"]').addEventListener('click', () => {
      startEditing(book);
    });

    item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      const confirmed = window.confirm(`Удалить книгу «${book.title}»?`);
      if (!confirmed) {
        return;
      }

      try {
        await api(`/api/books/${book.id}`, { method: 'DELETE' });
        if (editingBookId === book.id) {
          resetBookForm();
        }

        if (books.length === 1 && currentPage > 1) {
          currentPage -= 1;
        }

        await refreshData();
      } catch (error) {
        setError(bookError, error.message);
      }
    });

    booksList.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value)
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

async function loadStats() {
  const data = await api('/api/books/stats');
  renderStats(data.stats || {});
}

async function loadBooks() {
  const params = new URLSearchParams({
    page: String(currentPage),
    pageSize: String(currentPageSize),
  });

  const data = await api(`/api/books?${params.toString()}`);
  currentPagination = data.pagination || {
    page: currentPage,
    pageSize: currentPageSize,
    totalItems: data.books?.length || 0,
    totalPages: 1,
  };
  currentPage = currentPagination.page;
  currentPageSize = currentPagination.pageSize;
  pageSizeSelect.value = String(currentPageSize);
  renderBooks(data.books || []);
  updatePaginationUi();
}

async function refreshData() {
  await Promise.all([loadStats(), loadBooks()]);
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
    await refreshData();
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
    if (editingBookId) {
      await api(`/api/books/${editingBookId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await api('/api/books', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    resetBookForm();
    currentPage = 1;
    await refreshData();
  } catch (error) {
    setError(bookError, error.message);
  }
});

cancelEditButton.addEventListener('click', () => {
  resetBookForm();
});

toggleFormButton.addEventListener('click', () => {
  if (isFormOpen) {
    resetBookForm();
  } else {
    resetBookForm({ keepOpen: true });
  }
});

refreshButton.addEventListener('click', async () => {
  try {
    await refreshData();
  } catch (error) {
    setError(bookError, error.message);
  }
});

pageSizeSelect.addEventListener('change', async () => {
  currentPageSize = Number(pageSizeSelect.value);
  currentPage = 1;
  try {
    await loadBooks();
  } catch (error) {
    setError(bookError, error.message);
  }
});

prevPageButton.addEventListener('click', async () => {
  if (currentPage <= 1) {
    return;
  }

  currentPage -= 1;
  try {
    await loadBooks();
  } catch (error) {
    setError(bookError, error.message);
  }
});

nextPageButton.addEventListener('click', async () => {
  if (currentPage >= currentPagination.totalPages) {
    return;
  }

  currentPage += 1;
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
    resetBookForm();
    showLogin();
  }
});

(function init() {
  resetBookForm();
  updatePaginationUi();
  renderStats({});
})();

(async function bootstrap() {
  try {
    await refreshData();
    showApp();
  } catch {
    showLogin();
  }
})();
