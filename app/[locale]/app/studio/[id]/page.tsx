import { getTranslations, setRequestLocale } from 'next-intl/server';
import { projects } from '@/lib/data';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { id } = await params;
  const { name } = await searchParams;
  
  const project = projects.find(p => p.id === id);
  const projectName = name || (project ? project.title : id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '));

  return {
    title: projectName
  };
}

export default async function ProjectStudioPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 overflow-hidden h-full">
      <section className="flex-1 overflow-y-auto p-4">
        {/* Studio content (editor) will go here */}
      </section>
      
      <aside className="hidden md:block w-80 border-l overflow-y-auto p-4">
        {/* Settings panel content will go here */}
      </aside>
    </main>
  )
}
