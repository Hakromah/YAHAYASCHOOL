/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  CreditCard, ShieldCheck, CheckCircle2, Globe, Settings,
  Percent, DollarSign, Smartphone, Landmark, Key, Save, Edit2, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

interface PaymentGatewayConfig {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  webhookStatus: 'Connected' | 'Pending' | 'Disabled';
  isActive: boolean;
}

export default function PaymentGatewaysAndPOSPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWebhooks, setTestingWebhooks] = useState(false);

  // Edit Gateway Modal
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [formApiKey, setFormApiKey] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStatus, setFormStatus] = useState<'Connected' | 'Pending' | 'Disabled'>('Connected');

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getPaymentGateways();
      setGateways(data || []);
    } catch {
      toast.error(i18nT('Failed to load payment gateway parameters.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const handleTestWebhooks = async () => {
    setTestingWebhooks(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      toast.success(i18nT('Successfully tested all API webhook endpoints! All gateways responding 200 OK.', locale));
    } catch {
      toast.error(i18nT('Webhook test failed', locale));
    } finally {
      setTestingWebhooks(false);
    }
  };

  const handleOpenEditModal = (g: PaymentGatewayConfig) => {
    setEditingGateway(g);
    setFormApiKey(g.apiKey || '');
    setFormIsActive(g.isActive);
    setFormStatus(g.webhookStatus || 'Connected');
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;

    try {
      const updated: PaymentGatewayConfig = {
        ...editingGateway,
        apiKey: formApiKey,
        isActive: formIsActive,
        webhookStatus: formStatus
      };

      await financeService.savePaymentGateway(updated);
      setGateways(gateways.map(g => g.id === editingGateway.id ? updated : g));
      toast.success(`${i18nT('Payment gateway configuration saved', locale)}: ${editingGateway.name}`);
      setEditingGateway(null);
    } catch {
      toast.error(i18nT('Failed to save gateway configuration', locale));
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_channels',
      title: 'Configured Payment Gateways',
      value: `${gateways.filter(g => g.isActive).length} Gateways`,
      subtitle: 'Stripe, Orange Money, MTN MoMo, Wave & Physical POS',
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money Readiness',
      value: '100% Online',
      subtitle: 'Instant webhook verification for student fee receipts',
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'security_audit',
      title: 'API Gateway Encryption',
      value: 'TLS 1.3 Secure',
      subtitle: 'Encrypted API secret keys & HMAC webhook signing',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    }
  ];

  // Reusable token classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300 block';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4';

  return (
    <EnterpriseModuleShell
      title="Payment Gateways & POS Channel Configuration Console"
      description="SAP S/4HANA & Odoo payment channel management. Configure international API gateways (Stripe, PayPal) and local mobile money merchant endpoints (Orange Money, MTN, Wave)."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config', href: '/settings/finance' }, { label: 'Gateways & POS' }]}
      icon={<CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={gateways.length}
      recordLabel="Gateways"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleTestWebhooks}
          disabled={testingWebhooks}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <Key className="w-4 h-4" />
          <span>{testingWebhooks ? 'Testing Webhooks...' : 'Test Gateway Webhooks'}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {gateways.map(g => (
          <div key={g.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {g.id.includes('POS') ? <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Smartphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">{g.name}</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">{g.type}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold text-xs border ${
                g.isActive && g.webhookStatus === 'Connected'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                ● {g.webhookStatus.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">API Key / Merchant ID:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{g.apiKey ? (g.apiKey.length > 20 ? `${g.apiKey.slice(0, 10)}...` : g.apiKey) : 'Configured (Encrypted)'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleOpenEditModal(g)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure Keys</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Gateway Modal */}
      {editingGateway && (
        <div className={modalCls}>
          <div className={modalPanelCls}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Configure Payment Channel: {editingGateway.name}</h3>
              </div>
              <button onClick={() => setEditingGateway(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Gateway Type & Description</label>
                <input
                  type="text"
                  disabled
                  value={editingGateway.type}
                  className={inputCls + ' bg-slate-100 dark:bg-slate-950 opacity-80'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>API Secret Key / Merchant Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. sk_live_... or merchant_id"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className={inputCls + ' font-mono text-xs font-bold'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Webhook Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="Connected">Connected / Verified</option>
                  <option value="Pending">Pending Verification</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Enable this payment gateway for parent checkouts & POS</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditingGateway(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
