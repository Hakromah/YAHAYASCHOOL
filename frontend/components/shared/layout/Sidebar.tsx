'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Settings, ChevronLeft, ChevronRight,
  LogOut, Bell, BookOpen, DollarSign, Home, Calendar, Clipboard, Bus,
  GraduationCap, UserCheck, Menu, X, Heart,
  BookCheck, MonitorPlay, Award, PenTool, BarChart, Library, Trophy, ArrowRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useMobile } from '@/hooks/useMobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { STORAGE_KEYS } from '@/lib/constants';
import { getUserDisplayName, getUserInitials } from '@/types/user.types';
import type { AuthUser } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation configuration
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredPermission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations('navigation');
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const isMobile = useMobile();

  const [isCollapsed, setIsCollapsed] = useLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navSections: NavSection[] = [
    {
      title: t('overview'),
      items: [
        { label: t('dashboard'), href: ROUTES.DASHBOARD.ROOT, icon: LayoutDashboard },
      ],
    },
    {
      title: t('administration'),
      items: [
        ...(can.manageUsers ? [{ label: t('users'), href: ROUTES.USERS.LIST, icon: Users }] : []),
        ...(can.viewAuditLogs ? [{ label: t('auditLogs'), href: ROUTES.AUDIT_LOGS.LIST, icon: FileText }] : []),
        { label: t('notifications'), href: '/notifications', icon: Bell },
      ],
    },
    {
      title: 'School ERP Core',
      items: [
        { label: 'Core Dashboard', href: '/erp/dashboard', icon: LayoutDashboard },
        { label: 'People Directory', href: '/directory', icon: Users },
        { label: 'Student SIS Profiles', href: '/students', icon: GraduationCap },
        { label: 'Faculty & Sheikhs', href: '/teachers', icon: UserCheck },
        { label: 'Parents Registry', href: '/parents', icon: Users },
        { label: 'Support Workers', href: '/workers', icon: Clipboard },
        { label: 'Academic Structure', href: '/academic-structure', icon: BookOpen },
      ],
    },
    {
      title: t('academics') + ' (LMS Core)',
      items: [
        { label: 'Teacher Dashboard', href: '/lms/teacher', icon: MonitorPlay },
        { label: 'Student Dashboard', href: '/lms/student', icon: GraduationCap },
        { label: 'Director Dashboard', href: '/lms/director', icon: BarChart },
        { label: 'Subjects & Curriculum', href: '/lms/subjects', icon: BookOpen },
        { label: 'Timetable & Classes', href: '/lms/timetables', icon: Calendar },
        { label: 'Lesson Planning', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework & Assignments', href: '/lms/homework', icon: BookCheck },
        { label: 'Continuous Assessment', href: '/lms/gradebook', icon: Award },
        { label: 'Attendance Registry', href: '/lms/attendance', icon: Clipboard },
        { label: 'Resource Library', href: '/lms/resources', icon: Library },
      ],
    },
    {
      title: "Qur'an Dept (QMS)",
      items: [
        { label: 'Teacher Dashboard', href: '/qms/teacher', icon: MonitorPlay },
        { label: 'Director Analytics', href: '/qms/director', icon: BarChart },
        { label: 'Programs & Groups', href: '/qms/programs', icon: Users },
        { label: 'Hifz Tracking', href: '/qms/memorization', icon: BookOpen },
        { label: 'Murajaah Engine', href: '/qms/revision', icon: Clipboard },
        { label: 'Tajweed Evaluation', href: '/qms/tajweed', icon: PenTool },
        { label: 'Daily Halaqah', href: '/qms/halaqah', icon: Users },
        { label: 'Qur\'an Attendance', href: '/qms/attendance', icon: UserCheck },
        { label: 'Da\'wah Activities', href: '/qms/dawah', icon: Heart },
        { label: 'Competitions & Certs', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Languages (LLMS)',
      items: [
        { label: 'Teacher Dashboard', href: '/llms/teacher', icon: MonitorPlay },
        { label: 'Director Analytics', href: '/llms/director', icon: BarChart },
        { label: 'Programs & Levels', href: '/llms/programs', icon: Users },
        { label: 'Placement Testing', href: '/llms/placement', icon: FileText },
        { label: 'Skill Analytics', href: '/llms/skills', icon: BookOpen },
        { label: 'Learning Portfolio', href: '/llms/portfolio', icon: Library },
        { label: 'Competitions', href: '/llms/competitions', icon: Trophy },
        { label: 'Achievements', href: '/llms/achievements', icon: Award },
      ],
    },
    {
      title: 'Exams & Assessment',
      items: [
        { label: 'Teacher Dashboard', href: '/assessment/teacher', icon: MonitorPlay },
        { label: 'Director Analytics', href: '/assessment/director', icon: BarChart },
        { label: 'Grading Systems', href: '/assessment/grading-schemes', icon: Settings },
        { label: 'Examinations', href: '/assessment/exams', icon: FileText },
        { label: 'Question Bank', href: '/assessment/question-bank', icon: Library },
        { label: 'Scheduling', href: '/assessment/scheduling', icon: Calendar },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: PenTool },
      ],
    },
    {
      title: 'Results & Reporting',
      items: [
        { label: 'Report Cards', href: '/results/report-cards', icon: BookOpen },
        { label: 'Transcripts', href: '/results/transcripts', icon: FileText },
        { label: 'Certificates', href: '/results/certificates', icon: Award },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Rankings', href: '/results/rankings', icon: Trophy },
      ],
    },
    {
      title: t('system'),
      items: [
        ...(can.accessFinance ? [{ label: t('finance'), href: '/finance', icon: DollarSign }] : []),
        { label: t('hostel'), href: '/hostel', icon: Home },
        { label: t('events'), href: '/events', icon: Calendar },
        ...(can.manageSettings ? [{ label: t('settings'), href: ROUTES.SETTINGS.ROOT, icon: Settings }] : []),
      ],
    },
  ];

  const role = user?.role?.type;
  const sections = navSections.filter(section => {
    if (!role) return false;
    const isSuper = role === 'super_admin' || role === 'system_admin';
    const isDirector = role === 'director';
    const isTeacher = role === 'teacher';
    const isStudent = role === 'student';
    const isParent = role === 'parent';
    const isAccountant = role === 'accountant' || role === 'account_lead';

    if (section.title === t('overview') || section.title === 'Overview') return true; 
    
    if (section.title === t('academics') + ' (LMS Core)' || section.title === 'Exams & Assessment' || section.title === 'Results & Reporting') {
      return isSuper || isDirector || isTeacher || isStudent || isParent;
    }
    
    if (section.title === t('administration') || section.title === 'School ERP Core') {
      return isSuper || isDirector || isTeacher;
    }

    if (section.title === "Qur'an Dept (QMS)" || section.title === 'Languages (LLMS)') {
      return isSuper || isDirector || isTeacher || isStudent;
    }
    
    if (section.title === t('system')) {
      return isSuper || isAccountant;
    }

    return isSuper;
  });

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD.ROOT) return pathname === href || pathname === '/';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo Area ────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border transition-all duration-250',
        isCollapsed ? 'justify-center px-4 py-4' : 'justify-between px-5 py-4'
      )}>
        {!isCollapsed && (
          <Link href={ROUTES.DASHBOARD.ROOT} className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
              <Image
                src="/yahaya-logo.jpeg"
                alt="YAHAYASCOOL"
                width={28}
                height={28}
                className="rounded-lg object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
                YAHAYASCOOL
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                School Management
              </p>
            </div>
          </Link>
        )}

        {isCollapsed && (
          <Link href={ROUTES.DASHBOARD.ROOT}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Image src="/yahaya-logo.jpeg" alt="YAHAYASCOOL" width={28} height={28} className="rounded-lg object-contain" />
            </div>
          </Link>
        )}

        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => item.href);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        'group relative',
                        active
                          ? 'nav-item-active'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        active ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                      )} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {active && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User + Controls ──────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm',
            'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            'transition-all duration-150'
          )}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          {!isCollapsed && (
            <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* User info */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5',
          isCollapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold border border-primary/30">
            {user ? getUserInitials(user as unknown as Parameters<typeof getUserInitials>[0]) : '?'}
          </div>
          {!isCollapsed && user && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {getUserDisplayName(user as unknown as Parameters<typeof getUserDisplayName>[0])}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize">
                {user.role?.type?.replace('-', ' ')}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout().catch(() => toast.error('Logout failed'));
          }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm',
            'text-destructive/70 hover:bg-destructive/10 hover:text-destructive',
            'transition-all duration-150',
            isCollapsed && 'justify-center'
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger (rendered by Header) */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />
              {/* Drawer */}
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col shadow-2xl"
              >
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50"
                >
                  <X className="w-4 h-4" />
                </button>
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border',
        'flex flex-col overflow-hidden sidebar-transition shadow-sm',
        className
      )}
    >
      {sidebarContent}
    </motion.aside>
  );
}

// Export mobile menu trigger for use in Header
export { };
