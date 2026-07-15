'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!role) {
        router.push('/auth/login');
      } else if (['super_admin', 'system_admin'].includes(role)) {
        router.push('/dashboard/admin');
      } else {
        // Assume role string directly matches the sub-path
        router.push(`/dashboard/${role.replace('_', '-')}`);
      }
    }
  }, [role, isLoading, router]);

  return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
}
