export interface City {
  slug: string;
  name: string;
  /** предложный падеж: "в Москве" */
  namePrepositional: string;
  yandexRegionId: number;
  /** сервисы волны 1 для этого города (слаги) */
  services: string[];
  /** локальная фактура для уникальности гео-страниц */
  localNote: string;
}

export const CITIES: City[] = [
  {
    slug: 'moskva',
    name: 'Москва',
    namePrepositional: 'в Москве',
    yandexRegionId: 213,
    services: ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov', 'kurier-express-dostavka'],
    localNote:
      'Самый большой объём заказов в стране: плотность ресторанов и дарксторов позволяет брать заказы без простоев почти в любом районе внутри МКАД.',
  },
  {
    slug: 'sankt-peterburg',
    name: 'Санкт-Петербург',
    namePrepositional: 'в Санкт-Петербурге',
    yandexRegionId: 2,
    services: ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov', 'kurier-express-dostavka'],
    localNote:
      'Второй по объёму рынок доставки: высокая плотность заказов в центре и спальных районах, развитая сеть дарксторов.',
  },
  {
    slug: 'ekaterinburg',
    name: 'Екатеринбург',
    namePrepositional: 'в Екатеринбурге',
    yandexRegionId: 54,
    services: ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov', 'kurier-express-dostavka'],
    localNote:
      'Крупнейший рынок доставки на Урале: стабильный поток заказов в центре и на Уралмаше, растущая сеть дарксторов.',
  },
  {
    slug: 'novosibirsk',
    name: 'Новосибирск',
    namePrepositional: 'в Новосибирске',
    yandexRegionId: 65,
    services: ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov', 'kurier-express-dostavka'],
    localNote:
      'Самый большой рынок доставки в Сибири: заказы концентрируются в центре, на левом берегу и в Академгородке.',
  },
  {
    slug: 'kazan',
    name: 'Казань',
    namePrepositional: 'в Казани',
    yandexRegionId: 43,
    services: ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov', 'kurier-express-dostavka'],
    localNote:
      'Активно растущий рынок доставки: высокий спрос в центре, Ново-Савиновском и Вахитовском районах.',
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
