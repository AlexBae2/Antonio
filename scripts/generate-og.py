#!/usr/bin/env python3
"""
Карточка ссылки app/opengraph-image.png (1200x630): её показывают Яндекс и Google
в сниппете, Телеграм и ВК в превью репоста.

Почему python, а не node рядом с generate-icons.mjs: в карточке есть текст, а
отрисовать текст без движка шрифтов нечем. Здесь фирменные Unbounded и Golos
берутся прямо из public/fonts - те же файлы, что отдаёт сайт, второй копии
шрифта в репозитории не появляется. Подписные субсеты Google Fonts разрезаны по
алфавитам: кириллический не содержит точки и цифр, латинский не содержит
кириллицы, поэтому пары склеиваются в один шрифт.

Зависимости только на время запуска: pip3 install pillow fonttools
Запуск: python3 scripts/generate-og.py
"""
from io import BytesIO
from pathlib import Path

from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"

# Хеши из public/fonts/fonts.css: (кириллица, латиница) для каждого начертания
FACES = {
    "unbounded": ("16434977", "d931a309"),
    "golos": ("c5677fe0", "bd1fa587"),
}

GRAPHITE = (0x20, 0x1E, 0x1B)
PAPER = (0xFA, 0xF8, 0xF5)
MUTED = (0xA8, 0xA2, 0x9A)
AMBER = (0xFF, 0x6B, 0x1A)

WIDTH, HEIGHT = 1200, 630
MARGIN = 80


def merged_font(family: str, weight: int) -> BytesIO:
    """Кириллический и латинский субсеты одного начертания, склеенные в один TTF"""
    parts = []
    for name in FACES[family]:
        font = TTFont(FONTS / f"{name}.woff2")
        # Шрифты вариативные, а склейка вариативные не умеет: сначала
        # закрепляем нужный вес, потом снимаем woff2-обёртку
        font = instantiateVariableFont(font, {"wght": weight})
        font.flavor = None
        buffer = BytesIO()
        font.save(buffer)
        buffer.seek(0)
        parts.append(buffer)

    out = BytesIO()
    Merger().merge(parts).save(out)
    out.seek(0)
    return out


FONT_CACHE: dict[tuple[str, int], BytesIO] = {}


def font(family: str, weight: int, size: int):
    key = (family, weight)
    if key not in FONT_CACHE:
        FONT_CACHE[key] = merged_font(family, weight)
    FONT_CACHE[key].seek(0)
    return ImageFont.truetype(FONT_CACHE[key], size)


def main() -> None:
    card = Image.new("RGB", (WIDTH, HEIGHT), GRAPHITE)
    draw = ImageDraw.Draw(card)

    # Знак и словесная марка одной строкой, как в шапке сайта
    mark = Image.open(ROOT / "public" / "icon-512.png").convert("RGBA")
    mark = mark.resize((88, 88), Image.LANCZOS)
    card.paste(mark, (MARGIN, 68), mark)
    draw.text((MARGIN + 112, 112), "Смена.ру", font=font("unbounded", 600, 44), fill=PAPER, anchor="lm")

    headline = font("unbounded", 600, 66)
    draw.text((MARGIN, 236), "Работа курьером", font=headline, fill=PAPER)
    draw.text((MARGIN, 322), "и сборщиком заказов", font=headline, fill=PAPER)

    sub = font("golos", 400, 29)
    draw.text((MARGIN, 432), "Подбираем сервис доставки, помогаем оформиться", font=sub, fill=MUTED)
    draw.text((MARGIN, 474), "и выйти на первую смену. Бесплатно для соискателя.", font=sub, fill=MUTED)

    # Пунктирный маршрут и точка назначения - тот же мотив, что в знаке
    y = 556
    x = MARGIN
    while x < MARGIN + 300:
        draw.rounded_rectangle([x, y - 3, x + 16, y + 3], radius=3, fill=AMBER)
        x += 28
    draw.ellipse([x, y - 13, x + 26, y + 13], fill=AMBER)

    draw.text(
        (WIDTH - MARGIN, y),
        "smenaru.ru",
        font=font("golos", 500, 30),
        fill=AMBER,
        anchor="rm",
    )

    out = ROOT / "app" / "opengraph-image.png"
    card.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)} {out.stat().st_size} B ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
