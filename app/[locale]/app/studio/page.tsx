import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProjectItem } from '@/components/project-item';

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
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <ProjectItem 
          title="Project Alpha" 
          description="A sophisticated text-to-speech project for commercial use." 
        />
        <ProjectItem 
          title="Project Beta" 
          description="Experimental voice synthesis with neural processing." 
        />
        <ProjectItem 
          title="Project Gamma" 
          description="Automated narration for digital publications and blogs." 
        />
      </div>
    </>
  )
}
