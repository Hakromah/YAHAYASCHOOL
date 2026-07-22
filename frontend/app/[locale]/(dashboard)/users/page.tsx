/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, MoreVertical, Search, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import type { SchoolUser } from '@/types/user.types';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const res = await userService.getUsers({ page, pageSize: 15, search: query });
        setUsers(res.data);
        setTotalPages(res.pagination?.pageCount || 1);
      } catch (err) {
        console.error('Failed to load users:', err);
        toast.error('Failed to load system users');
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [page, query]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-indigo-500" />
            <span>System Users</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage authentication accounts, system roles, and access credentials.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/users/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-sm font-medium">
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, username or AC ID..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {loading && users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading system users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            No system users found.
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            )}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-medium">User & ID Code</th>
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((user) => {
                  const nameStr = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'No Name';
                  const rawId = String(user.id || '');
                  const idCode = user.schoolId || (user as any).documentId || (rawId.startsWith('AC') ? rawId : rawId ? 'AC' + rawId.padStart(8, '0') : 'AC000000001');
                  const avatarPhoto = user?.avatarUrl || user?.photoUrl || (user as any)?.avatar || (user as any)?.photo;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={avatarPhoto} name={nameStr} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {nameStr}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                {idCode}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">| {user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                          {user.role?.name || 'No Role'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.blocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/users/${user.id}/edit`}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this user?')) {
                                // Delete logic placeholder
                                toast.info('Delete functionality coming soon');
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
