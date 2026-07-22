'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Settings, ChevronLeft, ChevronRight,
  LogOut, Bell, BookOpen, DollarSign, Home, Calendar, Clipboard, Bus,
  GraduationCap, UserCheck, Menu, X, Heart, BookCheck, MonitorPlay, Award,
  PenTool, BarChart3, Library, Trophy, ArrowRight, Building2, Search, Sun, Moon,
  Layers, FileSearch, ShieldCheck, Globe, HardDrive, AlignLeft, Megaphone,
  Key, Flag, LayoutGrid, ChevronDown, ChevronUp, School, MapPin, Car,
  ClipboardList, Wallet, Receipt, TrendingUp, Package, Boxes, Wrench,
  MessageSquare, Clock, UserCog, Landmark, ScrollText, BookMarked,
  HeartHandshake, UsersRound, Cpu, Fuel, AlertTriangle, Presentation,
  FolderOpen, SquareCheckBig, Star, BadgeCheck, Compass, CreditCard,
  QrCode, Coins, PiggyBank, Scale, Percent, ShoppingBag, Bed, KeyRound, ShieldAlert
} from 'lucide-react';
import { useTheme } from 'next-themes';
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
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Role-specific navigation configurations
// ─────────────────────────────────────────────────────────────────────────────

const getHostelERPNav = () => ({
  title: 'Hostel ERP Suite',
  items: [
    { label: 'Hostel Dashboard', href: '/hostel?tab=dashboard', icon: LayoutDashboard },
    { label: 'Buildings & Floors', href: '/hostel?tab=buildings', icon: Building2 },
    { label: 'Rooms & Beds', href: '/hostel?tab=rooms', icon: Bed },
    { label: 'Bed Allocations', href: '/hostel?tab=allocations', icon: ClipboardList },
    { label: 'Waiting List', href: '/hostel?tab=waiting-list', icon: Users },
    { label: 'Fee Plans & Setup', href: '/hostel?tab=feeplans', icon: FileText },
    { label: 'Security Deposits', href: '/hostel?tab=deposits', icon: ShieldCheck },
    { label: 'Visitor Logs', href: '/hostel?tab=visitors', icon: KeyRound },
    { label: 'Gate Passes', href: '/hostel?tab=gatepasses', icon: ShieldAlert },
    { label: 'Attendance Logs', href: '/hostel?tab=attendance', icon: Calendar },
    { label: 'Wardens & Duty', href: '/hostel?tab=wardens', icon: UserCheck },
    { label: 'Maintenance Tickets', href: '/hostel?tab=maintenance', icon: Wrench },
    { label: 'Reports & Settings', href: '/hostel?tab=settings', icon: Settings },
  ]
});

function getSuperAdminNav(): NavSection[] {
  return [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Users', href: '/users', icon: Users },
        { label: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/audit-logs', icon: FileSearch },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Activity Logs', href: '/activity-logs', icon: AlignLeft },
        { label: 'Login Sessions', href: '/settings/sessions', icon: Key },
        { label: 'Localization', href: '/settings/languages', icon: Globe },
        { label: 'Media Library', href: '/media', icon: HardDrive },
      ],
    },
    {
      title: 'School ERP',
      items: [
        { label: 'People Directory', href: '/directory', icon: UsersRound },
        { label: 'Students', href: '/students', icon: GraduationCap },
        { label: 'Teachers', href: '/teachers', icon: UserCheck },
        { label: 'Parents', href: '/parents', icon: Heart },
        { label: 'Workers', href: '/workers', icon: Clipboard },
        { label: 'Departments', href: '/academic-structure', icon: Layers },
        { label: 'Programs', href: '/academic-structure/programs', icon: BookMarked },
        { label: 'Sections', href: '/academic-structure/sections', icon: Boxes },
        { label: 'Academic Years', href: '/academic-structure/years', icon: Calendar },
        { label: 'Academic Terms', href: '/academic-structure/terms', icon: Clock },
        { label: 'School Calendar', href: '/calendar', icon: Calendar },
        { label: 'Admissions Hub', href: '/erp/admissions', icon: GraduationCap },
      ],
    },
    {
      title: 'Enterprise Operations ERP',
      items: [
        { label: 'Admissions ERP', href: '/erp/admissions', icon: GraduationCap },
        { label: 'Transport Logistics', href: '/transport', icon: Bus },
        { label: 'Library System', href: '/library', icon: BookOpen },
        { label: 'Inventory & Supplies', href: '/inventory', icon: Package },
        { label: 'Fixed Assets', href: '/assets', icon: Landmark },
        { label: 'Procurement & AP', href: '/procurement', icon: ShoppingBag },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Academic Management',
      items: [
        { label: 'Subjects & Curriculum', href: '/lms/subjects', icon: BookOpen },
        { label: 'Classes & Timetable', href: '/lms/timetables', icon: School },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Assessments & Gradebook', href: '/lms/gradebook', icon: Award },
        { label: 'Learning Resources', href: '/lms/resources', icon: Library },
      ],
    },
    {
      title: "Qur'an Department",
      items: [
        { label: 'Programs & Groups', href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Tracking', href: '/qms/memorization', icon: BookOpen },
        { label: 'Muraja\'ah', href: '/qms/revision', icon: Clipboard },
        { label: 'Tajweed', href: '/qms/tajweed', icon: PenTool },
        { label: 'Daily Halaqah', href: '/qms/halaqah', icon: BookCheck },
        { label: "Qur'an Attendance", href: '/qms/attendance', icon: SquareCheckBig },
        { label: "Da'wah Activities", href: '/qms/dawah', icon: Heart },
        { label: 'Competitions & Certs', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Department',
      items: [
        { label: 'Programs & Levels', href: '/llms/programs', icon: UsersRound },
        { label: 'Placement Tests', href: '/llms/placement', icon: FileText },
        { label: 'Skill Analytics', href: '/llms/skills', icon: BarChart3 },
        { label: 'Learning Portfolio', href: '/llms/portfolio', icon: FolderOpen },
        { label: 'Competitions', href: '/llms/competitions', icon: Trophy },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Assessment & Exams',
      items: [
        { label: 'Assessment Types', href: '/assessment/grading-schemes', icon: Layers },
        { label: 'Examinations', href: '/assessment/exams', icon: FileText },
        { label: 'Question Bank', href: '/assessment/question-bank', icon: Library },
        { label: 'Scheduling', href: '/assessment/scheduling', icon: Calendar },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: PenTool },
      ],
    },
    {
      title: 'Results & Certification',
      items: [
        { label: 'Results Overview', href: '/results', icon: BarChart3 },
        { label: 'Report Cards', href: '/results/report-cards', icon: FileText },
        { label: 'Transcripts', href: '/results/transcripts', icon: ScrollText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Rankings', href: '/results/rankings', icon: Trophy },
      ],
    },
    {
      title: 'Finance ERP (Executive)',
      items: [
        { label: 'Executive Dashboard', href: '/finance', icon: DollarSign },
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Double-Entry Journals', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
        { label: 'Accounting Periods', href: '/finance/accounting/periods', icon: Clock },
      ],
    },
    {
      title: 'Billing & Cashier Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Installment Plans', href: '/finance/billing/installments', icon: Percent },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    {
      title: 'Payroll, Expenses & Budgets',
      items: [
        { label: 'Staff Payroll Runs', href: '/finance/payroll', icon: Wallet },
        { label: 'Payroll Approvals', href: '/finance/payroll/approvals', icon: SquareCheckBig },
        { label: 'Expense Requests', href: '/finance/expenses', icon: Receipt },
        { label: 'Expense Approvals', href: '/finance/expenses/approvals', icon: SquareCheckBig },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Donation Campaigns', href: '/finance/donations', icon: HeartHandshake },
      ],
    },
    {
      title: 'Finance Reports & Audit',
      items: [
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Audit Log & Search', href: '/finance/audit', icon: FileSearch },
        { label: 'Finance Settings', href: '/settings/finance', icon: Settings },
      ],
    },
    {
      title: 'Events & CMS',
      items: [
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Website CMS', href: '/cms', icon: Globe },
        { label: 'Gallery', href: '/cms/gallery', icon: Package },
        { label: 'Contact Messages', href: '/cms/contact', icon: MessageSquare },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'School Profile', href: '/settings/school-profile', icon: School },
        { label: 'Integrations', href: '/settings/integrations', icon: Cpu },
      ],
    },
  ];
}

function getDirectorNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'Academic Management',
      items: [
        { label: 'Subjects & Curriculum', href: '/lms/subjects', icon: BookOpen },
        { label: 'Timetable', href: '/lms/timetables', icon: School },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Gradebook', href: '/lms/gradebook', icon: Award },
        { label: 'Resources', href: '/lms/resources', icon: Library },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Teachers', href: '/teachers', icon: UserCheck },
        { label: 'Students', href: '/students', icon: GraduationCap },
        { label: 'Parents', href: '/parents', icon: Heart },
        { label: 'Departments', href: '/academic-structure', icon: Layers },
      ],
    },
    {
      title: "Qur'an Department",
      items: [
        { label: 'Programs & Groups', href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Progress', href: '/qms/memorization', icon: BookOpen },
        { label: 'Attendance', href: '/qms/attendance', icon: SquareCheckBig },
        { label: 'Achievements', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Department',
      items: [
        { label: 'Programs & Levels', href: '/llms/programs', icon: UsersRound },
        { label: 'Skill Analytics', href: '/llms/skills', icon: BarChart3 },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Assessments',
      items: [
        { label: 'Examinations', href: '/assessment/exams', icon: FileText },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: PenTool },
        { label: 'Scheduling', href: '/assessment/scheduling', icon: Calendar },
      ],
    },
    {
      title: 'Results',
      items: [
        { label: 'Report Cards', href: '/results/report-cards', icon: FileText },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Rankings', href: '/results/rankings', icon: Trophy },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Executive Finance (Read-Only)',
      items: [
        { label: 'Executive Dashboard', href: '/finance', icon: DollarSign },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Waqf Donations', href: '/finance/donations', icon: HeartHandshake },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getTeacherNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Work',
      items: [
        { label: 'My Timetable', href: '/lms/timetables', icon: School },
        { label: 'My Classes', href: '/lms/subjects', icon: BookOpen },
        { label: 'My Students', href: '/students', icon: GraduationCap },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Assessments', href: '/assessment/teacher', icon: FileText },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: Award },
        { label: 'Gradebook', href: '/lms/gradebook', icon: BarChart3 },
      ],
    },
    {
      title: "Qur'an",
      items: [
        { label: "Qur'an Groups", href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Tracking', href: '/qms/memorization', icon: BookOpen },
        { label: 'Murajaah', href: '/qms/revision', icon: Clipboard },
        { label: 'Tajweed', href: '/qms/tajweed', icon: PenTool },
        { label: 'Halaqah', href: '/qms/halaqah', icon: BookCheck },
        { label: "Qur'an Attendance", href: '/qms/attendance', icon: SquareCheckBig },
      ],
    },
    {
      title: 'Languages',
      items: [
        { label: 'Language Programs', href: '/llms/programs', icon: UsersRound },
        { label: 'Student Skills', href: '/llms/skills', icon: BarChart3 },
        { label: 'Portfolio', href: '/llms/portfolio', icon: FolderOpen },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Events', href: '/cms/events', icon: Calendar },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'My Profile', href: '/profile', icon: UserCog },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getStudentNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Academics',
      items: [
        { label: 'My Profile', href: '/profile', icon: UserCog },
        { label: 'My Timetable', href: '/lms/timetables', icon: School },
        { label: 'My Subjects', href: '/lms/subjects', icon: BookOpen },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'My Results', href: '/results/report-cards', icon: FileText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Achievements', href: '/results/rankings', icon: Trophy },
      ],
    },
    {
      title: "Qur'an Progress",
      items: [
        { label: 'Hifz Progress', href: '/qms/memorization', icon: BookOpen },
        { label: 'Murajaah', href: '/qms/revision', icon: Clipboard },
        { label: 'Achievements', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Progress',
      items: [
        { label: 'Arabic', href: '/llms/skills', icon: Globe },
        { label: 'Portfolio', href: '/llms/portfolio', icon: FolderOpen },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'My Fees & Ledger',
      items: [
        { label: 'Financial Ledger', href: '/finance/billing/ledger', icon: ScrollText },
        { label: 'Payment Receipts', href: '/finance/billing/payments', icon: Receipt },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getParentNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Children',
      items: [
        { label: 'Children Overview', href: '/students', icon: GraduationCap },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Results', href: '/results/report-cards', icon: FileText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Behavior Reports', href: '/results/rankings', icon: AlertTriangle },
      ],
    },
    {
      title: 'Progress',
      items: [
        { label: "Qur'an Progress", href: '/qms/memorization', icon: BookOpen },
        { label: 'Language Progress', href: '/llms/skills', icon: Globe },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Parent Payment Center',
      items: [
        { label: 'Payment Center & Balances', href: '/finance/parent-center', icon: DollarSign },
        { label: 'Invoices & Installments', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Receipts & Verification', href: '/finance/billing/payments', icon: QrCode },
      ],
    },
    {
      title: 'Communication & Events',
      items: [
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getAccountantNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Finance Dashboard', href: '/finance', icon: LayoutDashboard }] },
    {
      title: 'Billing & Cashier Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Installment Plans', href: '/finance/billing/installments', icon: Percent },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Accounting Engine',
      items: [
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Journal Entries', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
      ],
    },
    {
      title: 'Operations & Payroll',
      items: [
        { label: 'Expense Requisitions', href: '/finance/expenses', icon: Receipt },
        { label: 'Payroll Runs', href: '/finance/payroll', icon: Wallet },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Donations', href: '/finance/donations', icon: HeartHandshake },
        { label: 'Financial Reports', href: '/finance/reports', icon: TrendingUp },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getAccountLeadNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Executive Dashboard', href: '/finance', icon: LayoutDashboard }] },
    {
      title: 'Executive Approvals',
      items: [
        { label: 'Payroll Approvals', href: '/finance/payroll/approvals', icon: SquareCheckBig },
        { label: 'Expense Approvals', href: '/finance/expenses/approvals', icon: SquareCheckBig },
        { label: 'Budget Approvals', href: '/finance/budget/approvals', icon: Landmark },
        { label: 'Accounting Periods', href: '/finance/accounting/periods', icon: Clock },
      ],
    },
    {
      title: 'Treasury & Accounting',
      items: [
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Double-Entry Journals', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    {
      title: 'Billing & Aid Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Audit & Reports',
      items: [
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Immutable Audit Trail', href: '/finance/audit', icon: FileSearch },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
        { label: 'Settings', href: '/settings/finance', icon: Settings },
      ],
    },
  ];
}

function getWorkerNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Work',
      items: [
        { label: 'Tasks', href: '/tasks', icon: ClipboardList },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Leave', href: '/leave', icon: Calendar },
        { label: 'Salary', href: '/finance/payroll', icon: Wallet },
        { label: 'Documents', href: '/documents', icon: FolderOpen },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getDriverNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Routes',
      items: [
        { label: 'Routes', href: '/transport/routes', icon: MapPin },
        { label: 'My Students', href: '/students', icon: GraduationCap },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Vehicle', href: '/transport/vehicle', icon: Car },
        { label: 'Maintenance', href: '/transport/maintenance', icon: Wrench },
        { label: 'Fuel Log', href: '/transport/fuel', icon: Fuel },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Emergency Contacts', href: '/transport/emergency', icon: AlertTriangle },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getNavForRole(role: string | undefined): NavSection[] {
  switch (role) {
    case 'super-administrator': return getSuperAdminNav();
    case 'director':            return getDirectorNav();
    case 'teacher':             return getTeacherNav();
    case 'student':             return getStudentNav();
    case 'parent':              return getParentNav();
    case 'accountant':          return getAccountantNav();
    case 'account-lead':        return getAccountLeadNav();
    case 'worker':              return getWorkerNav();
    case 'driver':              return getDriverNav();
    default:                    return [{ title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] }];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMobile();

  const [isCollapsed, setIsCollapsed] = useLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useLocalStorage<Record<string, boolean>>('sidebar_sections', {});

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const role = (user as any)?.role?.type as string | undefined;
  const navSections = useMemo(() => getNavForRole(role), [role]);

  const activeHref = useMemo(() => {
    let best = '';
    for (const section of navSections) {
      for (const item of section.items) {
        if (item.href.includes('?')) continue;
        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
          if (item.href.length > best.length) {
            best = item.href;
          }
        }
      }
    }
    return best;
  }, [pathname, navSections]);

  const isActive = (href: string) => {
    // Precise match for query parameters (e.g. /hostel?tab=dashboard)
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const params = new URLSearchParams(query);
      const pathMatches = pathname === path || pathname === `${path}/`;
      if (!pathMatches) return false;

      for (const [key, val] of params.entries()) {
        const paramVal = searchParams.get(key);
        if (key === 'tab' && val === 'dashboard' && !paramVal) {
          continue; // Default tab is dashboard when no query param is present
        }
        if (paramVal !== val) return false;
      }
      return true;
    }

    // Exact match for top-level pages to prevent them from staying active when on nested routes
    if (['/dashboard', '/finance', '/settings', '/results', '/directory', '/cms'].includes(href)) {
      return pathname === href || pathname === `${href}/`;
    }
    return href === activeHref;
  };

  // Auto-expand sections that contain the active page
  useEffect(() => {
    for (const section of navSections) {
      const hasActiveChild = section.items.some(item => isActive(item.href));
      if (hasActiveChild && !expandedSections[section.title]) {
        setExpandedSections(prev => ({ ...prev, [section.title]: true }));
      }
    }
  }, [pathname, searchParams, navSections]);

  // Auto scroll active item into view
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = document.querySelector('.active-sidebar-item');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, activeHref, searchParams]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isSectionExpanded = (title: string) => {
    if (expandedSections[title] === undefined) return true; // default open
    return expandedSections[title];
  };

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }

  const displayName = user ? getUserDisplayName(user as unknown as Parameters<typeof getUserDisplayName>[0]) : 'User';
  const initials = user ? getUserInitials(user as unknown as Parameters<typeof getUserInitials>[0]) : '??';
  const roleLabel = role ? role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const avatarUrl = user?.avatarUrl || user?.photoUrl || (user as any)?.photo?.url || null;

  const sidebarWidth = isCollapsed ? 72 : 280;

  const sidebarContent = (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col h-full bg-card border-r border-border',
        'transition-all duration-300 ease-in-out overflow-hidden',
        className
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className={cn('flex items-center border-b border-border flex-shrink-0', isCollapsed ? 'h-16 justify-center px-3' : 'h-16 px-4 gap-3')}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm shadow-lg">
            Y
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm text-foreground truncate"
              >
                YAHAYASCOOL
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn('ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0', isCollapsed && 'ml-0')}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {/* Section Header */}
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <span>{section.title}</span>
                {isSectionExpanded(section.title)
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Section Items */}
            <AnimatePresence initial={false}>
              {(isCollapsed || isSectionExpanded(section.title)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5"
                >
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                          isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5',
                          active
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active-sidebar-item'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className={cn('flex-shrink-0 transition-transform', isCollapsed ? 'w-5 h-5' : 'w-4 h-4', active && 'scale-110')} />
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-medium truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {item.label}
                          </div>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-border flex-shrink-0 p-2 space-y-1')}>
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex items-center gap-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5 w-full'
          )}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!isCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        <div 
          className={cn('flex items-center gap-3 rounded-xl p-2 group relative cursor-pointer', !isCollapsed && 'hover:bg-muted transition-colors')}
          title={isCollapsed ? `${displayName} (${user?.schoolId || user?.username || 'AC000000001'})` : undefined}
        >
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700"
              />
            ) : null}
            <div className={cn(
              "w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm",
              avatarUrl && "hidden"
            )}>
              {initials}
            </div>
          </div>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex flex-col">
              <span className="font-bold">{displayName}</span>
              <span className="text-[10px] font-mono text-emerald-500">{user?.schoolId || user?.username || 'AC000000001'}</span>
            </div>
          )}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-muted text-emerald-600 dark:text-emerald-400">
                    {user?.schoolId || user?.username || 'AC000000001'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate capitalize mt-0.5">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-card border border-border shadow-md text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px]"
              >
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return sidebarContent;
}
