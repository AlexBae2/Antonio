import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SERVICES, getService } from '@/lib/data/services';
import { ROLES, getRole } from '@/lib/data/roles';
import { CITIES, getCity } from '@/lib/data/cities';
import { absUrl, SITE_YEAR } from '@/lib/site';
import ServiceView from '@/components/views/ServiceView';
import RoleView from '@/components/views/RoleView';
import CityView from '@/components/views/CityView';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return [
    ...SERVICES.map((s) => ({ slug: s.slug })),
    ...ROLES.map((r) => ({ slug: r.slug })),
    ...CITIES.map((c) => ({ slug: c.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;

  const service = getService(slug);
  if (service) {
    const kind = service.role === 'picker' ? 'сборщиком заказов' : 'курьером';
    return {
      title: `Работа ${kind} в ${service.brand}: вакансии, условия, выплаты ${SITE_YEAR}`,
      description: `Как устроиться ${kind} в ${service.brand}: требования от ${service.minAge} лет, оформление, еженедельные выплаты. Заявка за 2 минуты, перезвоним за 30 минут. Бесплатно.`,
      alternates: { canonical: absUrl(`/${slug}/`) },
    };
  }

  const role = getRole(slug);
  if (role) {
    return {
      title: `${role.name}: вакансии без опыта, свободный график ${SITE_YEAR}`,
      description: `${role.description.slice(0, 140)} Заявка за 2 минуты, подключение бесплатно.`,
      alternates: { canonical: absUrl(`/${slug}/`) },
    };
  }

  const city = getCity(slug);
  if (city) {
    return {
      title: `${city.name}: работа курьером и сборщиком, вакансии доставки ${SITE_YEAR}`,
      description: `Работа в доставке ${city.namePrepositional}: все крупные сервисы, подключение от 18 лет за 1-2 дня. Помогаем оформиться, для соискателя бесплатно.`,
      alternates: { canonical: absUrl(`/${slug}/`) },
    };
  }

  return {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const service = getService(slug);
  if (service) return <ServiceView service={service} />;

  const role = getRole(slug);
  if (role) return <RoleView role={role} />;

  const city = getCity(slug);
  if (city) return <CityView city={city} />;

  notFound();
}
