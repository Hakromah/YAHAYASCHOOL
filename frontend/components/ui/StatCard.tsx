'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  href?: string;
  isLoading?: boolean;
  delay?: number;
}

export function StatCard({
  id, title, value, subtitle, change, changeLabel,
  icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10',
  href, isLoading = false, delay = 0,
}: StatCardProps) {
  const trend = change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        'relative bg-card border border-border rounded-2xl p-5 overflow-hidden group',
        href && 'cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200'
      )}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="w-12 h-4 rounded bg-muted" />
          </div>
          <div className="w-20 h-7 rounded bg-muted" />
          <div className="w-32 h-4 rounded bg-muted" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            {trend !== null && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={cn(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                  trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {Math.abs(change!)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight mb-0.5">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm font-medium text-foreground/70">{title}</p>
          {(subtitle || changeLabel) && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle ?? changeLabel}</p>
          )}
          {href && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  return href ? <Link href={href} id={id}>{cardContent}</Link> : <div id={id}>{cardContent}</div>;
}
