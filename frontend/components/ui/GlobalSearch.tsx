'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, GraduationCap, UserCheck, Heart, BookOpen,
  FileText, Calendar, DollarSign, Award, Users, ArrowRight,
  ShieldAlert, Loader2, Layers, Clock
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/services/api.service';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string | number;
  title: string;
  subtitle?: string;
  category: 'student' | 'teacher' | 'parent' | 'worker' | 'subject' | 'class' | 'homework' | 'assessment' | 'finance' | 'general';
  href: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const { can, userRole } = usePermissions();

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Perform search across Strapi endpoints based on permissions
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const searchResults: SearchResultItem[] = [];
      const q = encodeURIComponent(query.trim());

      try {
        // 1. Students (if permitted or if self/parent)
        if (userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher' || (typeof can === 'object' && (can as any)?.manageUsers)) {
          try {
            const res = await apiClient.get(`/students?filters[$or][0][firstName][$contains]=${q}&filters[$or][1][lastName][$contains]=${q}&filters[$or][2][admissionNumber][$contains]=${q}&pagination[limit]=5`);
            const data = res.data?.data || [];
            data.forEach((item: any) => {
              searchResults.push({
                id: `student-${item.id}`,
                title: `${item.firstName || ''} ${item.lastName || ''}`.trim() || `Student #${item.id}`,
                subtitle: item.admissionNumber ? `Adm: ${item.admissionNumber}` : 'Student Profile',
                category: 'student',
                href: `/students/${item.id}`,
              });
            });
          } catch (e) { /* ignore if not permitted */ }
        }

        // 2. Teachers (if permitted)
        if (userRole === 'super-administrator' || userRole === 'director' || (typeof can === 'object' && (can as any)?.manageUsers)) {
          try {
            const res = await apiClient.get(`/teachers?filters[$or][0][firstName][$contains]=${q}&filters[$or][1][lastName][$contains]=${q}&filters[$or][2][employeeId][$contains]=${q}&pagination[limit]=5`);
            const data = res.data?.data || [];
            data.forEach((item: any) => {
              searchResults.push({
                id: `teacher-${item.id}`,
                title: `${item.firstName || ''} ${item.lastName || ''}`.trim() || `Teacher #${item.id}`,
                subtitle: item.employeeId ? `ID: ${item.employeeId}` : 'Faculty Member',
                category: 'teacher',
                href: `/teachers/${item.id}`,
              });
            });
          } catch (e) { /* ignore */ }
        }

        // 3. Subjects / Curriculum
        try {
          const res = await apiClient.get(`/subjects?filters[name][$contains]=${q}&pagination[limit]=5`);
          const data = res.data?.data || [];
          data.forEach((item: any) => {
            searchResults.push({
              id: `subject-${item.id}`,
              title: item.name || `Subject #${item.id}`,
              subtitle: item.code ? `Code: ${item.code}` : 'Academic Subject',
              category: 'subject',
              href: `/lms/subjects`,
            });
          });
        } catch (e) { /* ignore */ }

        // 4. Homework / Assessments
        try {
          const res = await apiClient.get(`/homeworks?filters[title][$contains]=${q}&pagination[limit]=5`);
          const data = res.data?.data || [];
          data.forEach((item: any) => {
            searchResults.push({
              id: `homework-${item.id}`,
              title: item.title || `Homework #${item.id}`,
              subtitle: item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleDateString()}` : 'Assignment',
              category: 'homework',
              href: `/lms/homework`,
            });
          });
        } catch (e) { /* ignore */ }

        // 5. Finance (if Accountant, Lead, or Super Admin)
        if (userRole === 'super-administrator' || userRole === 'accountant' || userRole === 'account-lead') {
          try {
            const res = await apiClient.get(`/donation-campaigns?filters[title][$contains]=${q}&pagination[limit]=5`);
            const data = res.data?.data || [];
            data.forEach((item: any) => {
              searchResults.push({
                id: `finance-${item.id}`,
                title: item.title || `Donation Campaign #${item.id}`,
                subtitle: `Target: ₦${Number(item.targetAmount || 0).toLocaleString()}`,
                category: 'finance',
                href: `/finance/donations`,
              });
            });
          } catch (e) { /* ignore */ }
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, userRole]);

  const handleSelect = useCallback((item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(item.href);
  }, [router]);

  // Arrow key navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, results.length - 1)));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, results, selectedIndex, handleSelect]);

  const getIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'student': return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case 'teacher': return <UserCheck className="w-4 h-4 text-amber-500" />;
      case 'parent': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'subject': return <BookOpen className="w-4 h-4 text-sky-500" />;
      case 'homework': return <FileText className="w-4 h-4 text-violet-500" />;
      case 'finance': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default: return <Search className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors w-full max-w-xs justify-between group"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>Search ERP, LMS, QMS...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-background border border-border rounded shadow-sm text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
            >
              {/* Search Bar */}
              <div className="flex items-center px-4 py-3.5 border-b border-border bg-muted/20">
                <Search className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students, teachers, homework, fees, classes..."
                  autoFocus
                  className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {results.length > 0 ? (
                  results.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors',
                        index === selectedIndex
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            index === selectedIndex ? 'bg-primary-foreground/20' : 'bg-muted'
                          )}
                        >
                          {getIcon(item.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{item.title}</p>
                          {item.subtitle && (
                            <p
                              className={cn(
                                'text-xs truncate',
                                index === selectedIndex ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              )}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
                            index === selectedIndex
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.category}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-70" />
                      </div>
                    </button>
                  ))
                ) : query.trim().length >= 2 && !isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs mt-0.5">Try searching with a different term or student ID.</p>
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Quick Search Suggestions
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { label: 'Students Directory', href: '/students' },
                        { label: 'Timetables & Classes', href: '/lms/timetables' },
                        { label: 'Attendance Records', href: '/lms/attendance' },
                        { label: "Qur'an Programs", href: '/qms/programs' },
                        { label: 'Fee Collections', href: '/finance' },
                      ].map((s) => (
                        <button
                          key={s.label}
                          onClick={() => {
                            setIsOpen(false);
                            router.push(s.href);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-sm"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 bg-background border border-border rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-background border border-border rounded">↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-background border border-border rounded">Enter</kbd> to select</span>
                </div>
                <span>Respects your role permissions</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
