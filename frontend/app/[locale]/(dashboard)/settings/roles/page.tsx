'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, CheckCircle2, Lock, Users, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState('super_admin');

  const roles = [
    { id: 'super_admin', name: 'Super Administrator', usersCount: 2, description: 'Unrestricted system-wide access across all enterprise ERP modules and Strapi configurations.', level: 'System Critical' },
    { id: 'admin', name: 'School Administrator / Principal', usersCount: 5, description: 'Manage school operations, student admissions, teacher directories, and campus reporting.', level: 'Executive' },
    { id: 'director', name: 'Academic Director', usersCount: 8, description: 'Oversee curriculum, examination approvals, report card certification, and academic structure.', level: 'Management' },
    { id: 'accountant', name: 'Financial Accountant', usersCount: 3, description: 'Manage fee invoicing, payroll, donation accounting, and financial ledger reports.', level: 'Finance' },
    { id: 'teacher', name: 'Faculty Educator / Teacher', usersCount: 48, description: 'Classroom management, attendance marking, homework grading, and marks entry.', level: 'Faculty' },
    { id: 'student', name: 'Enrolled Student', usersCount: 665, description: 'Access personal timetable, homework submissions, results, and learning resources.', level: 'Scholar' },
    { id: 'parent', name: 'Parent / Guardian', usersCount: 410, description: 'Monitor children attendance, fee payments, report cards, and communication.', level: 'Guardian' },
    { id: 'worker', name: 'Support Worker / Staff', usersCount: 22, description: 'Access duty schedules, maintenance tasks, transportation routes, and HR profile.', level: 'Staff' },
  ];

  const permissionsMatrix = [
    { module: 'User & Role Directory', read: true, write: selectedRole === 'super_admin' || selectedRole === 'admin', delete: selectedRole === 'super_admin' },
    { module: 'Student SIS & Admissions', read: true, write: ['super_admin', 'admin', 'director'].includes(selectedRole), delete: ['super_admin', 'admin'].includes(selectedRole) },
    { module: 'Teacher & Staff Roster', read: true, write: ['super_admin', 'admin'].includes(selectedRole), delete: selectedRole === 'super_admin' },
    { module: 'Academic Structure & Years', read: true, write: ['super_admin', 'admin', 'director'].includes(selectedRole), delete: selectedRole === 'super_admin' },
    { module: 'LMS Timetables & Homework', read: true, write: ['super_admin', 'admin', 'director', 'teacher'].includes(selectedRole), delete: ['super_admin', 'admin', 'director'].includes(selectedRole) },
    { module: 'QMS Qur\'anic Memorization', read: true, write: ['super_admin', 'admin', 'director', 'teacher'].includes(selectedRole), delete: ['super_admin', 'admin'].includes(selectedRole) },
    { module: 'Assessment & Gradebook', read: true, write: ['super_admin', 'admin', 'director', 'teacher'].includes(selectedRole), delete: ['super_admin', 'admin', 'director'].includes(selectedRole) },
    { module: 'Financial Accounting & Fees', read: ['super_admin', 'admin', 'accountant'].includes(selectedRole), write: ['super_admin', 'accountant'].includes(selectedRole), delete: selectedRole === 'super_admin' },
    { module: 'Audit Logs & System Security', read: selectedRole === 'super_admin', write: false, delete: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise Roles & Permissions Matrix</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure role-based access control (RBAC), granular module privileges, and security boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('New Role creation dialog opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roles List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Platform Roles</h3>
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between shadow-sm ${selectedRole === r.id ? 'bg-emerald-50 dark:bg-slate-800/90 border-emerald-500 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                    {r.usersCount} users
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{r.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Permissions Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Privilege Matrix: {roles.find(r => r.id === selectedRole)?.name}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Granular module permissions for this role across the ERP.</p>
            </div>
            <button
              onClick={() => toast.success('Permissions saved and synced with Strapi JWT claims')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Save Privileges
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/50">
                  <th className="py-3 px-4">ERP Module / Domain</th>
                  <th className="py-3 px-4 text-center">Read / View</th>
                  <th className="py-3 px-4 text-center">Write / Create / Edit</th>
                  <th className="py-3 px-4 text-center">Delete / Purge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {permissionsMatrix.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{item.module}</td>
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" checked={item.read} readOnly className="w-4 h-4 accent-emerald-600 dark:accent-emerald-500 rounded cursor-pointer" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" checked={item.write} readOnly className="w-4 h-4 accent-emerald-600 dark:accent-emerald-500 rounded cursor-pointer" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" checked={item.delete} readOnly className="w-4 h-4 accent-emerald-600 dark:accent-emerald-500 rounded cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
