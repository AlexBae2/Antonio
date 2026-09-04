# Как устроен блог и что писать в статьях

Статьи лежат рядом в `content/blog/*.mdx`. Имя файла = slug = URL `/blog/<slug>/`.

## Frontmatter

```yaml
---
title: "До 60 символов, попадает в <title> и в выдачу"
description: "150-165 символов, с цифрой и призывом. Это сниппет."
h1: "Заголовок на странице, отличается от title"
publishAt: "2026-09-08"   # дата в будущем = отложенная публикация
updatedAt: "2026-09-01"
targetQuery: "основной запрос из Wordstat"
category: "Одна из существующих категорий"
author: "redakcia"
---
```

`publishAt` в будущем прячет статью из листинга, sitemap и сборки. Ежедневный ребилд
(systemd-таймер на проде, cron в GitHub Actions для стенда) публикует её сам, когда дата
наступит. Ссылки на ещё не опубликованные статьи `resolveBlogHref` уводит на `/blog/`,
поэтому ссылаться на статью из очереди безопасно.

## Требования к тексту

- 1100-1400 слов, 5-6 разделов `##`, последний всегда `## Частые вопросы про ...` с `###`.
- Первый абзац отвечает на запрос сразу, без разгона.
- Тире: обычный дефис или двоеточие. Длинное тире не используем.
- 2-4 внутренние ссылки на реальные страницы сайта (список слагов ниже). Для опорных
  статей, которые собирают вокруг себя тему (например «как стать курьером»), ссылок
  больше: их задача как раз развести читателя по страницам сервисов и ролей.

## Цифры и источники

Каждая цифра дохода, ставки или срока сопровождается источником и датой снятия:
`*Данные на: июль 2026. Источник: kuper.ru/rabota.*` Проверенные факты лежат в
`research/tariffs.md`, `research/tariffs-magnit.md`, `research/new/tariffs-yandex-3.md`
с пометками `[OFFICIAL-CONFIRMED]` и `[UNVERIFIED]`. Помеченное как `[UNVERIFIED]`
подаём как «по данным партнёров», не как официальную цифру сервиса.

Чего не делаем: не обещаем конкретный заработок, не гарантируем подключение к сервису,
не даём юридических и налоговых консультаций (пишем, как устроено, и отправляем к ФНС
или к юристу), не выдумываем отзывы и кейсы.

## Слаги для внутренних ссылок

Сервисы: `/kurier-dostavka-edy/`, `/kurier-produkty-darkstore/`, `/kurier-zakazy-iz-magazinov/`,
`/kurier-express-dostavka/`, `/sborshchik-marketpleys/`, `/kurier-zdorovoe-pitanie/`,
`/kurier-produktovye-seti/`, `/smennaya-podrabotka/`, `/kurier-posylki-i-gruzy/`,
`/voditel-taksi/`, `/kurier-dostavka-supermarket/`

Роли: `/peshiy-kurier/`, `/velo-kurier/`, `/avto-kurier/`, `/sborshchik-zakazov/`

Прочее: `/kalkulyator-dohoda/`, `/podbor/`, `/voprosy/`, `/slovar-terminov/`,
`/metodologiya/`, `/otzyvy/`, `/sravnenie/lavka-ili-eda/`, `/sravnenie/kuper-ili-samokat/`
