/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { Link } from '@/i18n/routing';
import {
  Users, Shield, Plus, Search, ChevronLeft, ChevronRight, Edit2,
  Trash2, X, CheckCircle2, ShieldCheck, Award, GraduationCap,
  DollarSign, Receipt, BookOpen, User, HeartHandshake, Car,
  Wrench, RefreshCw, Layers, Filter, Check, Eye, Lock, Unlock,
  SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { userService } from '@/services/user.service';
import type { SchoolUser } from '@/types/user.types';
import { Avatar } from '@/components/shared/Avatar';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Role Color & Icon Mapping ────────────────────────────────────────────────

function getRoleConfig(roleNameOrType?: string) {
  const r = (roleNameOrType || '').toLowerCase().replace(/[\s_-]+/g, '');

  if (r.includes('superadmin') || r.includes('administrator') || r.includes('admin')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      activeTab: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30',
      dot: 'bg-purple-500',
      icon: ShieldCheck,
      label: 'Super Admin',
    };
  }
  if (r.includes('director')) {
    return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      activeTab: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/30',
      dot: 'bg-amber-500',
      icon: Award,
      label: 'Director',
    };
  }
  if (r.includes('sectionhead') || r.includes('dean')) {
    return {
      badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      activeTab: 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30',
      dot: 'bg-sky-500',
      icon: Layers,
      label: 'Section Head',
    };
  }
  if (r.includes('registrar')) {
    return {
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
      activeTab: 'bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-600/30',
      dot: 'bg-cyan-500',
      icon: GraduationCap,
      label: 'Registrar',
    };
  }
  if (r.includes('accountlead') || r.includes('financelead')) {
    return {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      activeTab: 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30',
      dot: 'bg-indigo-500',
      icon: DollarSign,
      label: 'Account Lead',
    };
  }
  if (r.includes('accountant') || r.includes('cashier') || r.includes('bursar')) {
    return {
      badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
      activeTab: 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/30',
      dot: 'bg-teal-500',
      icon: Receipt,
      label: 'Accountant',
    };
  }
  if (r.includes('teacher') || r.includes('faculty') || r.includes('instructor')) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      activeTab: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30',
      dot: 'bg-emerald-500',
      icon: BookOpen,
      label: 'Teacher',
    };
  }
  if (r.includes('student') || r.includes('scholar')) {
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      activeTab: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30',
      dot: 'bg-blue-500',
      icon: User,
      label: 'Student',
    };
  }
  if (r.includes('parent') || r.includes('guardian')) {
    return {
      badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      activeTab: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30',
      dot: 'bg-rose-500',
      icon: HeartHandshake,
      label: 'Parent',
    };
  }
  if (r.includes('driver') || r.includes('transport')) {
    return {
      badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      activeTab: 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/30',
      dot: 'bg-orange-500',
      icon: Car,
      label: 'Driver',
    };
  }
  if (r.includes('worker') || r.includes('staff') || r.includes('support')) {
    return {
      badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      activeTab: 'bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-700/30',
      dot: 'bg-slate-400',
      icon: Wrench,
      label: 'Worker',
    };
  }

  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    activeTab: 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30',
    dot: 'bg-slate-400',
    icon: Shield,
    label: roleNameOrType || 'Authenticated',
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  // Data States
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [sortField, setSortField] = useState<'name' | 'username' | 'role' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formBlocked, setFormBlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Scroll Container Ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Load Users and Roles from Strapi
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([
        userService.getUsers({ pageSize: 200 }),
        userService.getRoles(),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
      if (rolesRes.status === 'fulfilled') {
        setRoles(rolesRes.value || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load system users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Wheel Scroll Event
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop += e.deltaY;
    }
  };

  // ── Compute Roles with Real User Counts ──────────────────────────────────────

  const roleCategories = useMemo(() => {
    // Map existing system roles
    const roleList = roles.filter(r => r.name !== 'Public');

    // Make sure all roles present in users list are accounted for
    const roleKeys = new Set(roleList.map(r => r.type || r.name?.toLowerCase()));

    const categories = roleList.map(r => {
      const rKey = r.type || r.name?.toLowerCase();
      const count = users.filter(u => {
        const uType = u.role?.type?.toLowerCase();
        const uName = u.role?.name?.toLowerCase();
        return uType === rKey || uName === r.name?.toLowerCase();
      }).length;

      return {
        id: r.id,
        key: rKey,
        name: r.name,
        type: r.type,
        count,
        cfg: getRoleConfig(r.name || r.type),
      };
    });

    // Check if there are users with roles not explicitly in the roles array
    users.forEach(u => {
      const uKey = u.role?.type?.toLowerCase() || u.role?.name?.toLowerCase();
      if (uKey && !roleKeys.has(uKey)) {
        roleKeys.add(uKey);
        const count = users.filter(usr => (usr.role?.type?.toLowerCase() || usr.role?.name?.toLowerCase()) === uKey).length;
        categories.push({
          id: u.role?.id || Math.random(),
          key: uKey,
          name: u.role?.name || uKey,
          type: u.role?.type || uKey,
          count,
          cfg: getRoleConfig(u.role?.name || uKey),
        });
      }
    });

    // Sort roles by highest user count, then alphabetically
    return categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [roles, users]);

  // ── Filtered & Sorted Users ─────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Role Category Filter
      if (selectedRoleKey !== 'all') {
        const uType = (user.role?.type || '').toLowerCase();
        const uName = (user.role?.name || '').toLowerCase();
        const target = selectedRoleKey.toLowerCase();
        if (uType !== target && uName !== target) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'active' && user.blocked) return false;
      if (statusFilter === 'blocked' && !user.blocked) return false;

      // 3. Search Query
      if (query.trim()) {
        const q = query.toLowerCase();
        const name = (user.displayName || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const schoolId = (user.schoolId || '').toLowerCase();
        const roleName = (user.role?.name || '').toLowerCase();

        if (!name.includes(q) && !username.includes(q) && !email.includes(q) && !schoolId.includes(q) && !roleName.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'name') {
        valA = (a.displayName || a.username || '').toLowerCase();
        valB = (b.displayName || b.username || '').toLowerCase();
      } else if (sortField === 'username') {
        valA = (a.username || '').toLowerCase();
        valB = (b.username || '').toLowerCase();
      } else if (sortField === 'role') {
        valA = (a.role?.name || '').toLowerCase();
        valB = (b.role?.name || '').toLowerCase();
      } else if (sortField === 'status') {
        valA = a.blocked ? 'blocked' : 'active';
        valB = b.blocked ? 'blocked' : 'active';
      }

      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [users, selectedRoleKey, statusFilter, query, sortField, sortAsc]);

  const activeFiltersCount = [
    selectedRoleKey !== 'all',
    statusFilter !== 'all',
    query.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedRoleKey('all');
    setStatusFilter('all');
    setQuery('');
  };

  // ── KPI Statistics ───────────────────────────────────────────────────────────

  const totalUsers = users.length;
  const activeCount = users.filter(u => !u.blocked).length;
  const blockedCount = users.filter(u => u.blocked).length;
  const totalRoles = roles.filter(r => r.name !== 'Public').length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Total System Users',
      value: String(totalUsers),
      subtitle: `${activeCount} active user accounts`,
      trendDirection: 'neutral',
      icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      isActive: selectedRoleKey === 'all',
      onClick: () => setSelectedRoleKey('all'),
    },
    {
      id: 'active',
      title: 'Active Accounts',
      value: String(activeCount),
      subtitle: 'Currently active credentials',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      isActive: statusFilter === 'active',
      onClick: () => setStatusFilter(statusFilter === 'active' ? 'all' : 'active'),
    },
    {
      id: 'blocked',
      title: 'Blocked / Suspended',
      value: String(blockedCount),
      subtitle: 'Restricted system access',
      trendDirection: blockedCount > 0 ? 'down' : 'neutral',
      icon: <Lock className={cn('w-5 h-5', blockedCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400')} />,
      isActive: statusFilter === 'blocked',
      onClick: () => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked'),
    },
    {
      id: 'roles',
      title: 'Configured Roles',
      value: String(totalRoles),
      subtitle: `${roleCategories.length} active permission tiers`,
      trendDirection: 'neutral',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleEditClick = (u: SchoolUser) => {
    setEditingUser(u);
    setFormFirstName(u.firstName || '');
    setFormLastName(u.lastName || '');
    setFormUsername(u.username || '');
    setFormEmail(u.email || '');
    setFormRoleId(String(u.role?.id || ''));
    setFormBlocked(u.blocked || false);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const payload: any = {
        firstName: formFirstName,
        lastName: formLastName,
        displayName: `${formFirstName} ${formLastName}`.trim() || formUsername,
        username: formUsername,
        email: formEmail,
        blocked: formBlocked,
      };
      if (formRoleId) {
        payload.role = parseInt(formRoleId, 10);
      }

      await userService.updateUser(editingUser.id, payload);
      toast.success('User profile updated successfully.');
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update user profile: ' + (err?.message || 'Server error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (u: SchoolUser) => {
    const nameStr = u.displayName || u.username || 'User';
    if (!window.confirm(`Are you sure you want to delete user account "${nameStr}"? This action cannot be undone.`)) {
      return;
    }

    setUsers(prev => prev.filter(usr => usr.id !== u.id));
    toast.success('User account deleted.');

    try {
      await userService.deleteUser(u.id);
    } catch (err: any) {
      toast.error('Failed to delete user on server.');
      loadData();
    }
  };

  const toggleSort = (field: 'name' | 'username' | 'role' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <EnterpriseModuleShell
      title="System Users & Role Management"
      description="Manage enterprise authentication credentials, role-based access tiers, and user statuses across faculty, students, parents, and administrative staff."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Settings' }, { label: 'Users' }]}
      icon={<Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredUsers.length}
      recordLabel="Users"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadData();
              toast.success('Users synchronized from Strapi.');
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>

          <Link
            href="/settings/roles"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Roles & Permissions
          </Link>

          <Link
            href="/users/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create User
          </Link>
        </div>
      }
    >
      {/* KPI Stat Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* ── ROLE CATEGORIZATION TABS ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Filter By Role Category
          </span>
          {selectedRoleKey !== 'all' && (
            <button
              onClick={() => setSelectedRoleKey('all')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Show All Roles ({totalUsers})
            </button>
          )}
        </div>

        {/* Horizontal Role Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {/* 'All' Tab */}
          <button
            onClick={() => setSelectedRoleKey('all')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border',
              selectedRoleKey === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 font-black'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
            )}
          >
            <Users className="w-4 h-4" />
            <span>All Users</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                selectedRoleKey === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              {totalUsers}
            </span>
          </button>

          {/* Dynamic Role Tabs */}
          {roleCategories.map(cat => {
            const isSelected = selectedRoleKey.toLowerCase() === cat.key.toLowerCase();
            const Icon = cat.cfg.icon;

            return (
              <button
                key={cat.id || cat.key}
                onClick={() => setSelectedRoleKey(cat.key)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border',
                  isSelected
                    ? cat.cfg.activeTab
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TOOLBAR & SEARCH BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, username, or AC ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* ── USERS TABLE (MAX 9 ROWS VISIBLE -> SCROLLBAR) ────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {/* Table Header / Record Summary */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
              {selectedRoleKey === 'all' ? 'All User Accounts' : `${selectedRoleKey} Accounts`}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {filteredUsers.length} Users
            </span>
          </div>

          {filteredUsers.length > 9 && (
            <span className="text-[11px] font-bold text-slate-400">
              Scroll table down for all {filteredUsers.length} records ↓
            </span>
          )}
        </div>

        {loading && users.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Synchronizing user credentials from Strapi...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeFiltersCount > 0
                ? 'No users match your selected role or search criteria.'
                : 'No users found in this category.'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* 
             Max height constrained to ~9 rows (each row ~58px + thead 48px = 570px max height).
             When > 9 rows exist, a smooth vertical scrollbar appears.
          */
          <div
            ref={tableContainerRef}
            onWheel={handleWheel}
            className="max-h-[570px] overflow-y-auto overflow-x-auto overscroll-contain relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-xs font-black uppercase tracking-wider text-[10px]">
                <tr>
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>User & ID Code</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('username')}
                    className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Username</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('role')}
                    className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>System Role</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(user => {
                  const nameStr = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'No Name';
                  const rawId = String(user.id || '');
                  const idCode = user.schoolId || (user as any).documentId || (rawId.startsWith('AC') ? rawId : rawId ? 'AC' + rawId.padStart(8, '0') : 'AC00000001');
                  const avatarPhoto = user?.avatarUrl || user?.photoUrl || (user as any)?.avatar || (user as any)?.photo;
                  const roleName = user.role?.name || user.role?.type || 'Authenticated';
                  const roleCfg = getRoleConfig(roleName);
                  const RoleIcon = roleCfg.icon;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={avatarPhoto} name={nameStr} size="sm" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 dark:text-white text-xs truncate">
                              {nameStr}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                                {idCode}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">| {user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
                        @{user.username}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleCfg.badge}`}>
                          <RoleIcon className="w-3 h-3 shrink-0" />
                          <span>{roleName}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        {user.blocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit User Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{users.length}</strong> total users
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Current Tier: {selectedRoleKey.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── EDIT USER MODAL ──────────────────────────────────────────────────── */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              Edit System User Account
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={e => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={e => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Username *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Assigned System Role</label>
                  <select
                    value={formRoleId}
                    onChange={e => setFormRoleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="">Select a role...</option>
                    {roles
                      .filter(r => r.name !== 'Public')
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Block Toggle */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBlocked}
                    onChange={e => setFormBlocked(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <div>
                    <p className="font-bold text-rose-500">Block Account Access</p>
                    <p className="text-[11px] text-slate-400">Prevents the user from logging in to the system.</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
