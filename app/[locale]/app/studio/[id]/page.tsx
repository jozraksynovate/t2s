import { getTranslations, setRequestLocale } from 'next-intl/server';
import { projects } from '@/lib/data';
import { StudioEditor } from '@/components/studio-editor';
import { StudioComposer } from '@/components/studio-composer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

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
  const t = await getTranslations({ locale, namespace: 'Studio' });

  return (
    <main className="flex flex-1 overflow-hidden h-full">
      <section className="flex flex-1 flex-col overflow-y-auto p-4">
        <Tabs defaultValue="text" className="flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <TabsList className="w-fit">
              <TabsTrigger value="text">{t('tabText')}</TabsTrigger>
              <TabsTrigger value="composer">{t('tabComposer')}</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" aria-label={t('copy')}>
              <Copy aria-hidden="true" />
            </Button>
          </div>
          <TabsContent value="text" className="flex-1">
            <StudioEditor />
          </TabsContent>
          <TabsContent value="composer" className="">
            <StudioComposer />
          </TabsContent>
        </Tabs>
      </section>
      
      <aside className="hidden md:block w-80 border-l overflow-y-auto p-4">
        {/* Settings panel content will go here */}
      </aside>
    </main>
  )
}
