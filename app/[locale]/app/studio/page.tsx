import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProjectItem } from '@/components/project-item';
import { projects } from '@/lib/data';

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
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {projects.map((project) => (
          <ProjectItem 
            key={project.id}
            title={project.title} 
            description={project.description} 
          />
        ))}
      </div>
    </div>
  )
}
