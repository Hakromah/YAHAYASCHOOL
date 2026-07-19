'use client';

import React, { useState } from 'react';
import { Package, Plus, Image, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function GalleryPage() {
  const albums = [
    { id: 1, title: 'Annual Hifz Graduation Ceremony 2026', photos: 48, cover: 'bg-emerald-950 border-emerald-800', date: 'July 10, 2026', featured: true },
    { id: 2, title: 'Campus Facilities & Mosque Architecture', photos: 24, cover: 'bg-sky-950 border-sky-800', date: 'June 15, 2026', featured: true },
    { id: 3, title: 'Inter-School Arabic Speech Tournament', photos: 36, cover: 'bg-amber-950 border-amber-800', date: 'May 20, 2026', featured: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Package className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span>Public Campus Photo Gallery & Albums</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curate public albums, campus life imagery, and high-resolution media for the school website.
          </p>
        </div>

        <button
          onClick={() => toast.info('New Gallery Album creator opened')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Album</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {albums.map((alb) => (
          <div key={alb.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div>
              <div className={`h-40 rounded-xl border flex items-center justify-center text-slate-400 mb-4 ${alb.cover}`}>
                <Image className="w-12 h-12 opacity-50" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{alb.photos} Photos</span>
                {alb.featured && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">Featured</span>}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{alb.title}</h3>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono">{alb.date}</span>
              <button onClick={() => toast.success(`Managing photos inside album: ${alb.title}`)} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Manage Photos</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
