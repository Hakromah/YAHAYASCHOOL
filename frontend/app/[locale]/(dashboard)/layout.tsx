import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
import DashboardShell from '@/components/shared/layout/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
return <DashboardShell>{children}</DashboardShell>;
}
