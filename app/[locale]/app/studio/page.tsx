import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProjectList } from '@/components/project-list';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return {
    title: t('studio')
  };
}

export default async function StudioPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <ProjectList />
    </div>
  )
}
