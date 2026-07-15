'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { Loader2 } from 'lucide-react';

export default function AccountLeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In Phase 3E, we fetch live data from our new API endpoints!
    apiClient.get('/dashboard/account-lead')
      .then(res => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard data', err);
        setLoading(false);
      });
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Account-lead Dashboard" description={`Welcome back, ${user?.firstName}`} />
      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Live Data Widgets go here */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">API Data Load</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">Success</p>
            <pre className="mt-4 text-xs text-gray-400 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
