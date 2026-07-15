'use client';
import { Award } from 'lucide-react';

export default function GradebookPage() {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center">
      <Award className="w-16 h-16 text-emerald-500 mb-4" />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Continuous Assessment (Gradebook)
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        This is a placeholder for the Gradebook console (Phase 3B).
      </p>
    </div>
  );
}
