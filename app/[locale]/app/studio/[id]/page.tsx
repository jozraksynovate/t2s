import { setRequestLocale } from 'next-intl/server';
import { projects } from '@/lib/data';
import { StudioWorkspace } from '@/components/studio-workspace';

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

  return <StudioWorkspace />
}
