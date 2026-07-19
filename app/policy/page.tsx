import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { absUrl, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных',
  description: `Как ${SITE_NAME} обрабатывает персональные данные соискателей: какие данные собираем, зачем, сколько храним и как отозвать согласие.`,
  alternates: { canonical: absUrl('/policy/') },
  robots: { index: false, follow: true },
};

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/policy/', label: 'Политика данных' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold">Политика обработки персональных данных</h1>
      <p className="mt-2 text-sm text-ink-soft">Редакция от 20.07.2026</p>

      <div className="mt-6 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-semibold">1. Кто обрабатывает данные</h2>
          <p className="mt-2">
            Оператор: юридическое лицо, реквизиты которого указаны на странице «Реквизиты» этого
            сайта. Настоящая политика действует для всех форм сбора данных на сайте.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">2. Какие данные и зачем</h2>
          <p className="mt-2">
            Мы собираем данные, которые вы указываете в форме заявки: город, возраст, гражданство,
            имя и номер телефона. Цель обработки: связаться с вами и помочь с подключением к
            выбранному сервису доставки. Дополнительно автоматически обрабатываются технические
            данные посещения (cookie, параметры визита) для работы сайта и веб-аналитики.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">3. Правовое основание</h2>
          <p className="mt-2">
            Обработка ведётся на основании вашего согласия, которое вы даёте, отмечая чекбокс перед
            отправкой формы. Без согласия заявка не отправляется.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">4. Хранение и передача</h2>
          <p className="mt-2">
            Данные хранятся на серверах на территории Российской Федерации. Для обработки заявки
            данные передаются специалистам колл-центра; номер телефона в служебных уведомлениях
            передаётся в маскированном виде. Данные не продаются и не передаются третьим лицам для
            рекламы.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">5. Сроки и отзыв согласия</h2>
          <p className="mt-2">
            Данные заявки хранятся до достижения цели обработки, но не дольше одного года с момента
            последнего контакта. Вы можете отозвать согласие в любой момент: напишите на адрес,
            указанный на странице «Реквизиты», и мы удалим ваши данные в течение 30 дней.
          </p>
        </section>
      </div>
    </div>
  );
}
