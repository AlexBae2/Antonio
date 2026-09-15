import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repeatLeadText } from './telegram.ts';

test('повторная заявка: админу уходит номер карточки, кто и когда подавал первый раз', () => {
  const text = repeatLeadText({
    id: 33,
    name: 'Антон',
    city: 'Москва',
    service: 'kurier-express-dostavka',
    phone: '89049990011',
    firstAt: '2026-09-13 13:18:51',
  });
  assert.equal(
    text,
    [
      '🔁 Повторная заявка #33',
      'Город: Москва',
      'Сервис: Самокат',
      'Имя: Антон',
      'Телефон: +8 904 999-00-11',
      'Первый раз: 13.09.2026 16:18 МСК',
    ].join('\n'),
  );
});

test('повторная заявка: время из базы считается по UTC, а не по локали машины', () => {
  const text = repeatLeadText({
    id: 1,
    name: '',
    city: '',
    service: '',
    phone: '79000000000',
    firstAt: '2026-12-31 22:30:00',
  });
  assert.ok(text.endsWith('Первый раз: 01.01.2027 01:30 МСК'), text);
  assert.ok(text.includes('Имя: не указано'));
  assert.ok(text.includes('Сервис: не выбран'));
});
