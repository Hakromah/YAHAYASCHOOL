import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function AutoRoleLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
return (
    <RoleGuard allowedRoles={['super-administrator', 'director', 'teacher', 'student', 'parent', 'registrar']}>
      {children}
    </RoleGuard>
  );
}
