'use client';
import { PenTool } from 'lucide-react';

export default function LessonPlansPage() {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center">
      <PenTool className="w-16 h-16 text-emerald-500 mb-4" />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Lesson Planning
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        This is a placeholder for the Lesson Planning portal (Phase 3B).
      </p>
    </div>
  );
}
