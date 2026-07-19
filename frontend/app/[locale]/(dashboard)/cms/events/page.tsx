'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Plus, Users, MapPin, Clock, Search,
  Filter, Download, Upload, Eye, CheckCircle2, AlertCircle, Sparkles,
  Radio, Share2, Globe
} from 'lucide-react';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export interface SchoolEvent {
  id: string;
  code: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  audience: 'All Campus' | 'Parents & Guardians' | 'Students & Faculty' | 'Faculty Only';
  capacity: number;
  registeredRSVPs: number;
  status: 'published' | 'draft' | 'completed';
  isLivestreamed: boolean;
}

export default function EventsPage() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const sampleEvents: SchoolEvent[] = [
    {
      id: 'EV-101',
      code: 'EVT-2026-881',
      title: 'Annual Hifz Graduation & Crown Ceremony',
      description: 'Institutional ceremony celebrating scholars completing full Quranic memorization with award presentations.',
      date: '2026-08-28',
      time: '09:00 AM - 02:00 PM',
      location: 'Main School Auditorium & Grand Mosque',
      audience: 'All Campus',
      capacity: 1200,
      registeredRSVPs: 1045,
      status: 'published',
      isLivestreamed: true
    },
    {
      id: 'EV-102',
      code: 'EVT-2026-882',
      title: 'Inter-School Arabic Debate & Oratory Championship',
      description: 'Regional competition testing classical Arabic fluency, rhetorical argumentation, and poetry recitation.',
      date: '2026-08-14',
      time: '10:00 AM - 01:00 PM',
      location: 'Language Department Hall B',
      audience: 'Students & Faculty',
      capacity: 350,
      registeredRSVPs: 290,
      status: 'published',
      isLivestreamed: true
    },
    {
      id: 'EV-103',
      code: 'EVT-2026-883',
      title: 'Term 1 Parent-Teacher Academic Progress Conference',
      description: 'One-on-one consultation sessions between faculty and parents regarding scholar academic and behavioural metrics.',
      date: '2026-07-25',
      time: '08:00 AM - 04:00 PM',
      location: 'Homeroom Classrooms & Gym Hall',
      audience: 'Parents & Guardians',
      capacity: 1800,
      registeredRSVPs: 1620,
      status: 'published',
      isLivestreamed: false
    },
    {
      id: 'EV-104',
      code: 'EVT-2026-884',
      title: 'STEM Robotics & Islamic Architecture Exhibition',
      description: 'Student showcase featuring automated robotics projects alongside geometric Islamic architectural models.',
      date: '2026-09-05',
      time: '11:00 AM - 03:00 PM',
      location: 'Science Wing Exhibition Courtyard',
      audience: 'All Campus',
      capacity: 600,
      registeredRSVPs: 140,
      status: 'draft',
      isLivestreamed: false
    },
    {
      id: 'EV-105',
      code: 'EVT-2026-885',
      title: 'Curriculum & Tajweed Standardized Training Workshop',
      description: 'Professional development seminar for teachers focusing on advanced Tajweed pedagogy and grading.',
      date: '2026-07-30',
      time: '01:00 PM - 04:30 PM',
      location: 'Faculty Lounge & Media Lab',
      audience: 'Faculty Only',
      capacity: 150,
      registeredRSVPs: 142,
      status: 'published',
      isLivestreamed: false
    },
  ];

  const filteredEvents = useMemo(() => {
    return sampleEvents.filter(e => {
      const matchQuery = !query || e.title.toLowerCase().includes(query.toLowerCase()) || e.code.toLowerCase().includes(query.toLowerCase()) || e.location.toLowerCase().includes(query.toLowerCase());
      const matchAud = audienceFilter === 'all' || e.audience === audienceFilter;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchQuery && matchAud && matchStatus;
    });
  }, [query, audienceFilter, statusFilter]);

  const activeFiltersCount = (audienceFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setAudienceFilter('all');
    setStatusFilter('all');
    setQuery('');
    toast.success('Event filters reset.');
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'published',
      title: 'Active Public Events',
      value: sampleEvents.filter(e => e.status === 'published').length.toString(),
      subtitle: '▲ +2 ceremonies confirmed this term',
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5" />,
      isActive: statusFilter === 'published',
      onClick: () => {
        setStatusFilter(statusFilter === 'published' ? 'all' : 'published');
        toast.info(statusFilter === 'published' ? 'Showing all events' : 'Filtered to Published Events');
      },
      badgeText: 'CMS Live'
    },
    {
      id: 'rsvps',
      title: 'Total Confirmed RSVPs',
      value: sampleEvents.reduce((acc, e) => acc + e.registeredRSVPs, 0).toLocaleString('en-US'),
      subtitle: '89.4% venue capacity utilization rate',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5" />,
      onClick: () => toast.success('Opened institutional venue capacity overview')
    },
    {
      id: 'stream',
      title: 'Livestream Broadcasts',
      value: sampleEvents.filter(e => e.isLivestreamed).length.toString(),
      subtitle: 'Multi-cam YouTube & Parent Portal feeds',
      trendDirection: 'up',
      icon: <Radio className="w-5 h-5 text-rose-400 animate-pulse" />,
      onClick: () => toast.info('Opened broadcast media studio dashboard')
    },
    {
      id: 'draft',
      title: 'Draft / Review Queue',
      value: sampleEvents.filter(e => e.status === 'draft').length.toString(),
      subtitle: 'Awaiting directorate sign-off',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5" />,
      isActive: statusFilter === 'draft',
      onClick: () => {
        setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft');
        toast.info(statusFilter === 'draft' ? 'Showing all events' : 'Filtered to Draft Queue');
      }
    }
  ];

  const columns = useMemo<ColumnDef<SchoolEvent, any>[]>(() => {
    return [
      {
        accessorKey: 'title',
        header: 'Event Code & Title',
        cell: ({ row }) => {
          const ev = row.original;
          return (
            <div className="space-y-1 max-w-md py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{ev.code}</span>
                {ev.isLivestreamed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                    <Radio className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 animate-pulse" /> Live Broadcast
                  </span>
                )}
              </div>
              <p className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm truncate">
                {ev.title}
              </p>
              {ev.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'date',
        header: 'Schedule & Timing',
        cell: ({ row }) => (
          <div className="space-y-1 font-mono text-xs py-1">
            <span className="text-slate-900 dark:text-white block font-extrabold flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{row.original.date}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400 block font-medium flex items-center gap-1.5 pl-5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{row.original.time}</span>
            </span>
          </div>
        )
      },
      {
        accessorKey: 'location',
        header: 'Venue & Capacity',
        cell: ({ row }) => {
          const ev = row.original;
          const occPct = Math.min(100, Math.round((ev.registeredRSVPs / ev.capacity) * 100));
          return (
            <div className="space-y-1.5 text-xs py-1 max-w-xs">
              <span className="text-slate-900 dark:text-white font-bold block truncate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{ev.location}</span>
              </span>
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span>RSVPs: <strong className="text-slate-900 dark:text-white">{ev.registeredRSVPs.toLocaleString('en-US')}</strong> / {ev.capacity.toLocaleString('en-US')}</span>
                <span className={`px-1.5 py-0.5 rounded font-extrabold ${
                  occPct >= 90 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                  {occPct}%
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'audience',
        header: 'Target Audience',
        cell: ({ row }) => {
          const aud = row.original.audience;
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs">
              <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{aud}</span>
            </span>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'CMS Status',
        cell: ({ row }) => <StatusBadge status={row.original.status === 'published' ? 'active' : row.original.status === 'draft' ? 'pending' : 'completed'} size="sm" />
      },
      {
        id: 'actions',
        header: 'Inspect Event',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 hover:text-white font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 hover:border-emerald-600 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Events & Institutional CMS Console"
      description="Organize institutional ceremonies, Hifz graduations, debate championships, parent conferences, and livestream broadcasts with venue RSVP tracking."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Events & CMS' }]}
      icon={<CalendarIcon className="w-8 h-8" />}
      recordCount={filteredEvents.length}
      recordLabel="Events"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('New Event Creator wizard opened.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Public Event</span>
          </button>
        </div>
      }
    >
      {/* Interactive Clickable KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search events by ceremony title, venue hall name, code, or audience..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => toast.success('Public CMS calendar refreshed')}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Schedule Event"
        onCreate={() => toast.info('Opened New Institutional Event scheduler.')}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              aria-label="Filter events by audience"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Audiences</option>
              <option value="All Campus">All Campus</option>
              <option value="Parents & Guardians">Parents & Guardians</option>
              <option value="Students & Faculty">Students & Faculty</option>
              <option value="Faculty Only">Faculty Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter events by status"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All CMS Statuses</option>
              <option value="published">Published Active</option>
              <option value="draft">Draft Review</option>
              <option value="completed">Past Completed</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredEvents}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => toast.info(`Opening event editor for ${row.title}`)}
        emptyStateProps={{
          title: 'No Events Found',
          description: 'No scheduled school ceremonies or CMS announcements match your search or filter combination.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Schedule New Ceremony',
          onCreate: () => toast.info('Opened new event scheduling dialog')
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.title,
          id: selectedRow.code,
          role: `INSTITUTIONAL EVENT (${selectedRow.status.toUpperCase()})`,
          status: selectedRow.status === 'published' ? 'active' : 'pending',
          email: `${selectedRow.location} | Capacity: ${selectedRow.capacity}`,
          balance: `${selectedRow.registeredRSVPs} RSVPs Confirmed (${Math.round((selectedRow.registeredRSVPs / selectedRow.capacity) * 100)}% Full)`
        } : null}
        category="event"
      />
    </EnterpriseModuleShell>
  );
}
