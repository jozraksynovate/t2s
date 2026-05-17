import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('HomePage');
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">{t('title')}</h1>
          <p>{t('description')}</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
