import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
export default function CompetitionsCertificatesPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
return (
    <div className="flex flex-col h-full items-center justify-center space-y-4 p-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Competitions & Certificates</h1>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-lg">
        This is a placeholder page for the Phase 3B QMS module: <strong>Competitions & Certificates</strong>.
        The full interface will be built out iteratively.
      </p>
    </div>
  );
}
