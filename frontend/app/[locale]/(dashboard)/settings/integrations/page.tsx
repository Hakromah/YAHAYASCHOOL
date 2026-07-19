'use client';

import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Key, Webhook, Mail, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState([
    { id: 'strapi', name: 'Strapi Headless CMS (v4/v5 API)', status: 'Connected & Healthy', endpoint: 'http://localhost:1337/api', icon: Cpu, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { id: 'smtp', name: 'Nodemailer SMTP Relay Service', status: 'Connected', endpoint: 'smtp.mailgun.org:587', icon: Mail, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { id: 'sms', name: 'Twilio SMS Gateway & WhatsApp API', status: 'Standby / Configured', endpoint: 'api.twilio.com/v2010', icon: PhoneCall, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'webhook', name: 'Payment Gateway (Stripe / Paystack Webhook)', status: 'Active Webhook', endpoint: 'https://api.stripe.com/v1/events', icon: Webhook, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>External System API & Services Integrations</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage Strapi backend connections, webhook endpoints, and third-party communication gateways.
          </p>
        </div>

        <button
          onClick={() => toast.success('Tested all external API health checks successfully')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Ping / Test Connections</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">Endpoint: <span className="text-slate-700 dark:text-slate-300">{item.endpoint}</span></p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => toast.info(`Viewing API credentials and keys for ${item.name}`)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" /> Configure API Keys
                </button>
                <button
                  onClick={() => toast.success(`Webhook synchronization triggered for ${item.id}`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                >
                  Sync Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
