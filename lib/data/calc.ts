/**
 * Модель калькулятора дохода.
 * Диапазоны ориентировочные, собраны из открытых тарифов сервисов и опыта подключений.
 * Точные цифры по сервисам обновляются из research/tariffs.md (см. /metodologiya/).
 */

export const CALC_DATA_DATE = '19.07.2026';

export interface TransportProfile {
  id: string;
  label: string;
  /** заказов в час: [минимум, максимум] в зависимости от плотности района */
  ordersPerHour: [number, number];
}

export const TRANSPORTS: TransportProfile[] = [
  { id: 'foot', label: 'Пешком', ordersPerHour: [1.5, 2.5] },
  { id: 'bike', label: 'Велосипед', ordersPerHour: [2, 3.5] },
  { id: 'ebike', label: 'Электровелосипед', ordersPerHour: [2.5, 4] },
  { id: 'car', label: 'Автомобиль', ordersPerHour: [2, 3] },
];

/** Ориентировочная оплата за заказ по типу сервиса, ₽: [минимум, максимум] */
export const PAY_PER_ORDER: Record<string, [number, number]> = {
  'kurier-dostavka-edy': [100, 220],
  'kurier-produkty-darkstore': [90, 180],
  'kurier-zakazy-iz-magazinov': [120, 250],
  'kurier-express-dostavka': [90, 170],
  'kurier-zdorovoe-pitanie': [110, 200],
  'kurier-produktovye-seti': [100, 190],
};

/** Сборщики: оплата за смену, ₽ */
export const PAY_PER_SHIFT: Record<string, [number, number]> = {
  'sborshchik-marketpleys': [2800, 4500],
};

/** Множитель плотности заказов по городам (Москва = 1) */
export const CITY_FACTOR: Record<string, number> = {
  moskva: 1,
  'sankt-peterburg': 0.95,
  ekaterinburg: 0.85,
  novosibirsk: 0.85,
  kazan: 0.85,
  other: 0.75,
};

export interface CalcInput {
  service: string;
  city: string;
  transport: string;
  hoursPerDay: number;
  daysPerWeek: number;
}

export interface CalcResult {
  perShift: [number, number];
  perWeek: [number, number];
  perMonth: [number, number];
  isShiftBased: boolean;
}

export function calcIncome(input: CalcInput): CalcResult | null {
  const cityFactor = CITY_FACTOR[input.city] ?? CITY_FACTOR.other;

  const shiftPay = PAY_PER_SHIFT[input.service];
  if (shiftPay) {
    const perShift: [number, number] = [Math.round(shiftPay[0] * cityFactor), Math.round(shiftPay[1] * cityFactor)];
    const perWeek: [number, number] = [perShift[0] * input.daysPerWeek, perShift[1] * input.daysPerWeek];
    return {
      perShift,
      perWeek,
      perMonth: [perWeek[0] * 4, perWeek[1] * 4],
      isShiftBased: true,
    };
  }

  const payRange = PAY_PER_ORDER[input.service];
  const transport = TRANSPORTS.find((t) => t.id === input.transport);
  if (!payRange || !transport) return null;

  const lowOrders = transport.ordersPerHour[0] * cityFactor;
  const highOrders = transport.ordersPerHour[1] * cityFactor;

  const perShift: [number, number] = [
    Math.round((lowOrders * payRange[0] * input.hoursPerDay) / 10) * 10,
    Math.round((highOrders * payRange[1] * input.hoursPerDay) / 10) * 10,
  ];
  const perWeek: [number, number] = [perShift[0] * input.daysPerWeek, perShift[1] * input.daysPerWeek];
  return {
    perShift,
    perWeek,
    perMonth: [perWeek[0] * 4, perWeek[1] * 4],
    isShiftBased: false,
  };
}
