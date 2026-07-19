import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="font-display text-6xl font-bold text-amber">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">Такой страницы нет</h1>
      <p className="mt-2 text-ink-soft">
        Возможно, ссылка устарела. Начните с главной или посмотрите вакансии по сервисам.
      </p>
      <Link
        href="/"
        className="tap mt-6 inline-flex items-center rounded-full bg-amber px-6 py-3 font-semibold text-white"
      >
        На главную
      </Link>
    </div>
  );
}
