# Music Search (FastAPI + Next.js)

Небольшой fullstack-проект для поиска музыки через Deezer API и сохранения избранных треков в рамках сессии.

## Стек

- Backend: `FastAPI`, `Uvicorn`, `httpx`, `SQLite`
- Frontend: `Next.js 14`, `React`, `TypeScript`, `Tailwind CSS`

## Структура проекта

- `backend` — API-сервер и хранение лайков (`likes.db`)
- `frontend` — клиентское приложение

## Требования

- Python `3.10+` (рекомендуется использовать локальное `.venv`)
- Node.js `18+`
- npm `9+`

## Быстрый старт

### 1) Backend

Из корня проекта:

```powershell
.\.venv\Scripts\python -m pip install -r .\backend\requirements.txt
.\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

Backend будет доступен по адресу: `http://127.0.0.1:8000`

Проверка health:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health
```

### 2) Frontend

В отдельном терминале:

```powershell
cd .\frontend
npm install
npm run dev
```

Frontend будет доступен по адресу: `http://localhost:3000`

## Переменные окружения

Во frontend используется:

- `NEXT_PUBLIC_API_URL` — базовый URL backend API.

Если не задана, по умолчанию используется `http://localhost:8000`.

Пример (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## API (backend)

- `GET /api/health` — проверка статуса
- `GET /api/search?q=<query>&limit=<1..50>` — поиск треков
- `GET /api/likes` — список избранного в текущей сессии
- `POST /api/likes/{track_id}` — добавить трек в избранное
- `DELETE /api/likes/{track_id}` — удалить трек из избранного

## Как работает избранное

- При первом запросе backend создает cookie `session_id`.
- Лайки хранятся в SQLite (`backend/likes.db`) с привязкой к `session_id`.
- На frontend запросы отправляются с `credentials: "include"`, чтобы использовать ту же сессию.

## Типичный сценарий проверки

1. Открыть `http://localhost:3000`
2. Найти любой трек
3. Поставить лайк (сердце)
4. Перейти во вкладку "Избранное"
5. Убедиться, что трек отображается
6. Снять лайк и проверить, что трек исчез из списка

## Полезные команды

### Frontend

```powershell
cd .\frontend
npm run dev
npm run lint
npm run build
```

### Backend

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

## Возможные проблемы

- PowerShell блокирует активацию `.venv` скриптом `Activate.ps1`.
  - Можно запускать Python напрямую: `.\.venv\Scripts\python ...` (как в примерах выше).
- Если frontend не стартует с ошибкой `next is not recognized`:
  - Выполнить `npm install` в папке `frontend`.
- Файл `next-swc.win32-x64-msvc.node` (Windows-бинарник SWC для Next.js) обязателен для запуска frontend на Windows.
  - Он устанавливается автоматически командой `npm install` в `frontend/node_modules`.
  - Этот файл не нужно добавлять в git (как и всю папку `node_modules`).
- Если frontend не видит backend:
  - Проверить, что backend работает на `:8000`.
  - Проверить `NEXT_PUBLIC_API_URL` и CORS-настройки.
