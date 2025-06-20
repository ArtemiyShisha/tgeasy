# Руководство по использованию 21st.dev MCP в проекте TGeasy

## 1. Введение

Этот документ определяет стандарты и лучшие практики использования **21st.dev Meta Component Protocol (MCP)** для генерации UI компонентов в проекте TGeasy. Следование этим правилам обязательно для всех разработчиков, чтобы обеспечить консистентность, производительность и высокое качество интерфейса.

## 2. Основные принципы

- **AI-First**: Мы доверяем AI генерацию UI. Основная работа разработчика — создание качественных и детализированных UI-требований в формате `.md`.
- **Консистентность**: Все компоненты должны соответствовать дизайн-системе, определенной в `configs/mcp-config.json`.
- **Атомарность**: Генерируйте небольшие, переиспользуемые компоненты, а не целые страницы одним запросом.

## 3. Процесс генерации UI

1.  **Создать UI-требования**: В директории `docs/ui-requirements/` создайте новый markdown-файл (например, `docs/ui-requirements/new-feature.md`).
2.  **Описать требования**: Детально опишите компонент, его состояния, пропсы и поведение. Используйте примеры из существующих файлов.
3.  **Сгенерировать компонент**: Используйте MCP плагин в вашей IDE, указав путь к файлу с требованиями.
4.  **Проверить результат**: Убедитесь, что сгенерированный компонент соответствует требованиям, корректно типизирован и не имеет багов.
5.  **Интегрировать**: Интегрируйте новый компонент в приложение.

## 4. Правила именования

- **Компоненты**: `PascalCase` (например, `ChannelCard`, `PostEditor`).
- **Файлы компонентов**: `kebab-case` (например, `channel-card.tsx`).
- **Пропсы интерфейсов**: `PascalCase` с суффиксом `Props` (например, `ChannelCardProps`).
- **Хуки**: `use` префикс в `camelCase` (например, `useChannels`).

## 5. Структура директорий

```
components/
├── ui/                   # Базовые компоненты shadcn/ui
├── auth/                 # Компоненты, связанные с аутентификацией
├── channels/             # Компоненты для управления каналами
├── posts/                # Компоненты для рекламных размещений
└── layout/               # Компоненты для структуры страниц
```

## 6. Гайдлайны по производительности

- **Ленивая загрузка**: Используйте `next/dynamic` для компонентов, которые не видны на первом экране.
- **Мемоизация**: Оборачивайте компоненты в `React.memo`, если их пропсы не меняются часто.
- **Минимизация ре-рендеров**: Используйте `useCallback` и `useMemo` для стабилизации ссылок на функции и объекты.
- **Оптимизация изображений**: Используйте компонент `next/image` для автоматической оптимизации.

## 7. Доступность (Accessibility)

- **Семантический HTML**: Используйте правильные HTML-теги для каждого элемента.
- **ARIA-атрибуты**: MCP должен автоматически добавлять необходимые ARIA-атрибуты. Проверяйте их наличие.
- **Фокус и клавиатура**: Все интерактивные элементы должны быть доступны с клавиатуры.

## 8. Безопасность

- **Никогда не используйте `dangerouslySetInnerHTML`** в сгенерированных компонентах.
- **Валидация пропсов**: Убедитесь, что все внешние данные (например, от API) проходят валидацию перед передачей в компоненты.

---
*Этот документ должен обновляться по мере развития проекта и изменения стандартов.* 