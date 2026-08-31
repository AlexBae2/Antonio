#!/usr/bin/env node
/**
 * Растровые иконки из фирменного знака (app/icon.svg): пунктирный маршрут
 * и янтарная точка назначения.
 *
 * Зачем свой рендер, а не sharp/ImageMagick: сборка не должна тянуть бинарные
 * зависимости (тот же урок, что и со шрифтами - см. комментарий в app/layout.tsx).
 * Здесь только node:zlib, поэтому скрипт работает и локально, и в CI.
 *
 * Запуск: node scripts/generate-icons.mjs
 * На выходе: app/favicon.ico (16/32/48) и app/apple-icon.png (180).
 * Геометрия ниже повторяет app/icon.svg - правите знак, прогоните скрипт.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');

const GRAPHITE = [0x20, 0x1e, 0x1b];
const PAPER = [0xfa, 0xf8, 0xf5];
const AMBER = [0xff, 0x6b, 0x1a];

// Всё в системе координат viewBox 0 0 64 64, как в app/icon.svg
const VIEW = 64;
const CORNER = 14;
const DASHES = [
  { x1: 12.12, y1: 51.88, x2: 15.66, y2: 48.34 },
  { x1: 24.85, y1: 39.15, x2: 28.38, y2: 35.62 },
];
const DASH_RADIUS = 3; // stroke-width 6 с круглыми концами
const DOT = { cx: 42, cy: 22, r: 11 };

const SAMPLES = 4; // сглаживание: 4x4 подпикселя

function insideRoundedRect(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function insideCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** Капсула: расстояние от точки до отрезка не больше радиуса */
function insideCapsule(x, y, { x1, y1, x2, y2 }, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(Math.max(((x - x1) * dx + (y - y1) * dy) / len2, 0), 1);
  return (x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2 <= r * r;
}

/** Цвет знака в точке viewBox или null, если точка вне фона */
function sample(x, y, rounded) {
  if (rounded ? !insideRoundedRect(x, y, VIEW, CORNER) : x < 0 || y < 0 || x > VIEW || y > VIEW) {
    return null;
  }
  if (insideCircle(x, y, DOT.cx, DOT.cy, DOT.r)) return AMBER;
  if (DASHES.some((dash) => insideCapsule(x, y, dash, DASH_RADIUS))) return PAPER;
  return GRAPHITE;
}

/** RGBA-пиксели размера size x size со сглаживанием по SAMPLES x SAMPLES */
function render(size, rounded) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = VIEW / size;
  const step = 1 / SAMPLES;
  const total = SAMPLES * SAMPLES;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const color = sample(
            (px + (sx + 0.5) * step) * scale,
            (py + (sy + 0.5) * step) * scale,
            rounded,
          );
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            hits += 1;
          }
        }
      }

      const offset = (py * size + px) * 4;
      if (hits > 0) {
        // Цвет усредняем по закрытым подпикселям, прозрачность - по их доле
        pixels[offset] = Math.round(r / hits);
        pixels[offset + 1] = Math.round(g / hits);
        pixels[offset + 2] = Math.round(b / hits);
        pixels[offset + 3] = Math.round((hits / total) * 255);
      }
    }
  }

  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** PNG (8 бит, RGBA) без внешних зависимостей */
function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // бит на канал
  ihdr[9] = 6; // truecolor + alpha
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // фильтр строки: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO с PNG внутри: так понимают все актуальные браузеры и краулер Google */
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // тип: иконка
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // цветовых плоскостей
    entry.writeUInt16LE(32, 6); // бит на пиксель
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

// Порядок от большего к меньшему: Next берёт размер первой записи для
// атрибута sizes, а Google советует favicon кратный 48px
const ico = encodeIco(
  [48, 32, 16].map((size) => ({ size, png: encodePng(size, render(size, true)) })),
);
writeFileSync(join(APP_DIR, 'favicon.ico'), ico);

// iOS сам скругляет и подкладывает фон, поэтому рисуем без скруглений
const apple = encodePng(180, render(180, false));
writeFileSync(join(APP_DIR, 'apple-icon.png'), apple);

console.log(`app/favicon.ico   ${ico.length} B (48/32/16)`);
console.log(`app/apple-icon.png ${apple.length} B (180x180)`);
