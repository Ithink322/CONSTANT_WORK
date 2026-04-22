# Intelligent Task Manager

Менеджер задач на `React + TypeScript + Vite` для frontend и `NestJS + Prisma + SQLite` для backend.  
Приложение поддерживает CRUD для задач, серверную фильтрацию и поиск, а также AI-функции: предложение категории, приоритета, декомпозицию задачи и сводку нагрузки.

## Технологии

- Frontend: React, TypeScript, Vite, TanStack Query, React Hook Form, Zod
- Backend: NestJS, Prisma, SQLite, OpenAI SDK
- Общие контракты: workspace-пакет с DTO и Zod-схемами

## Структура проекта

```text
apps/
  api/      NestJS API
  web/      React frontend
packages/
  shared/   Общие схемы, DTO и enum'ы
scripts/
  setup.mjs Подготовка проекта
  dev.mjs   Одновременный запуск frontend и backend
```

## Требования

- Node.js 20+
- npm 10+

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Выполнить первичную настройку проекта

```bash
npm run setup
```

Что делает `npm run setup`:

- создает `apps/api/.env` из `apps/api/.env.example`, если файла еще нет
- создает `apps/web/.env` из `apps/web/.env.example`, если файла еще нет
- собирает shared-пакет
- генерирует Prisma Client

### 3. Запустить приложение

```bash
npm run dev
```

После запуска будут доступны:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend API: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)

## Переменные окружения

Локальная конфигурация по умолчанию создается автоматически командой `npm run setup`.

### Backend

Файл: `apps/api/.env`

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
LLM_PROVIDER=heuristic
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### Frontend

Файл: `apps/web/.env`

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## Режимы AI

Проект поддерживает два режима работы AI:

- `LLM_PROVIDER=heuristic`  
  Локальный fallback-режим. Работает без внешнего API-ключа.

- `LLM_PROVIDER=openai`  
  Использует OpenAI Responses API и structured outputs.

Чтобы включить OpenAI, обновите `apps/api/.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Если OpenAI недоступен, backend автоматически переключается на heuristic-режим, чтобы приложение продолжало работать.

## Доступные команды

```bash
npm run setup        # подготовить env-файлы, собрать shared-пакет, сгенерировать Prisma Client
npm run dev          # запустить frontend и backend вместе
npm run dev:api      # запустить только backend
npm run dev:web      # запустить только frontend
npm run build        # production build для всех workspace-пакетов
npm run db:generate  # сгенерировать Prisma Client
```

## Особенности реализации

- Для локальной разработки используется SQLite.
- Backend сам проверяет наличие схемы базы данных при запуске.
- Общие Zod-схемы переиспользуются между frontend и backend для единых контрактов запросов и ответов.

## Что реализовано

- CRUD задач
- Серверная фильтрация по статусу, приоритету и сроку
- Полнотекстовый поиск по названию и описанию
- AI-предложение категории
- AI-предложение приоритета
- AI-декомпозиция задачи на подзадачи
- AI-сводка нагрузки
- Структурированные ошибки API

## Известные ограничения

- Нет авторизации и многопользовательского режима
- Для подтверждения удаления используется стандартный `window.confirm`
- AI-функции работают в request/response-режиме, без streaming

## Что можно добавить дальше

- E2E-тесты для CRUD и AI-сценариев
- Swagger / OpenAPI документацию
- Docker Compose для запуска одной командой
- Более развитую работу с подзадачами
