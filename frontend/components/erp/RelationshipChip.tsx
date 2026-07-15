'use client';

import React from 'react';
import Link from 'next/link';
import { Users, BookOpen, Building2, User, Award, Layers } from 'lucide-react';

interface RelationshipChipProps {
  type: 'section' | 'department' | 'program' | 'parent' | 'teacher' | 'student' | 'campus' | 'academicYear';
  label: string;
  sublabel?: string;
  href?: string;
}

export function RelationshipChip({ type, label, sublabel, href }: RelationshipChipProps) {
  const getIcon = () => {
    switch (type) {
      case 'section':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'department':
        return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'program':
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      case 'parent':
      case 'student':
        return <User className="w-3.5 h-3.5 text-purple-400" />;
      case 'teacher':
        return <Award className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Users className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'section':
        return 'border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-500/40 text-emerald-200';
      case 'department':
        return 'border-amber-500/20 bg-amber-950/20 hover:border-amber-500/40 text-amber-200';
      case 'program':
        return 'border-sky-500/20 bg-sky-950/20 hover:border-sky-500/40 text-sky-200';
      case 'teacher':
        return 'border-rose-500/20 bg-rose-950/20 hover:border-rose-500/40 text-rose-200';
      default:
        return 'border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40 text-purple-200';
    }
  };

  const content = (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200 ${getBorderColor()}`}
    >
      {getIcon()}
      <span>{label}</span>
      {sublabel && <span className="text-[10px] opacity-75 ml-0.5 font-normal">({sublabel})</span>}
    </span>
  );

  if (href) {
    return <Link href={href} className="inline-block">{content}</Link>;
  }

  return content;
}
