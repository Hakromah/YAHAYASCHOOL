'use client';

import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSection } from '@/providers/SectionContext';
import { SectionSubNav } from '@/components/shared/layout/SectionSubNav';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import { 
  BookOpen, CheckCircle2, Clock, FileText, 
  AlertCircle, XCircle, RefreshCw, Eye, X,
  ChevronRight, Layers, UserCheck, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SectionLessonPlansPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
const routeParams = useParams();
  const sectionId = (routeParams?.sectionId as string) || '';
  const { section, isLoading: sectionLoading } = useSection();
  
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  // Slide-over drawer state and scroll ref
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  // Handle wheel scrolling inside the drawer so it never gets intercepted or blocked
  const handleDrawerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop += e.deltaY;
    }
  };

  // Lock body scroll when drawer is open so background page doesn't shift
  useEffect(() => {
    if (showDrawer) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showDrawer]);

  useEffect(() => {
    if (sectionId) {
      loadLessonPlans();
    }
  }, [sectionId, section?.documentId]);

  const loadLessonPlans = async () => {
    setIsLoading(true);
    try {
      const targetDocId = section?.documentId || sectionId;
      const isNumeric = Boolean(targetDocId && !isNaN(Number(targetDocId)));
      const sectionFilter = isNumeric
        ? { id: { $eq: Number(targetDocId) } }
        : { documentId: { $eq: targetDocId } };

      const res = await apiClient.get('/lesson-plans', {
        params: {
          filters: { section: sectionFilter },
          populate: ['teacher', 'subject', 'section', 'academicYear', 'academicTerm'],
          sort: 'createdAt:desc',
          pagination: { limit: 100 }
        }
      });
      setLessonPlans(res.data?.data || []);
    } catch {
      toast.error('Failed to load lesson plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (documentId: string, newStatus: string, reason?: string) => {
    setSubmittingIds(prev => ({ ...prev, [documentId]: true }));
    try {
      const payload: any = { recordStatus: newStatus };
      if (reason !== undefined) {
        payload.rejectionReason = reason;
      }

      await apiClient.put(`/lesson-plans/${documentId}`, { data: payload });
      toast.success(`Lesson plan status updated to ${newStatus}.`);
      
      // Update selectedPlan state if drawer is open
      if (selectedPlan && (selectedPlan.documentId === documentId || selectedPlan.id === documentId)) {
        setSelectedPlan({ ...selectedPlan, recordStatus: newStatus, rejectionReason: reason || selectedPlan.rejectionReason });
      }

      await loadLessonPlans();
    } catch {
      toast.error('Failed to update lesson plan status.');
    } finally {
      setSubmittingIds(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const filteredPlans = lessonPlans.filter(lp => {
    if (filter === 'all') return true;
    if (filter === 'Draft' && (!lp.recordStatus || lp.recordStatus === 'Draft')) return true;
    return lp.recordStatus === filter;
  });

  const pendingCount = lessonPlans.filter(lp => lp.recordStatus === 'Pending Approval').length;
  const approvedCount = lessonPlans.filter(lp => lp.recordStatus === 'Approved').length;
  const rejectedCount = lessonPlans.filter(lp => lp.recordStatus === 'Rejected').length;
  const draftCount = lessonPlans.filter(lp => !lp.recordStatus || lp.recordStatus === 'Draft').length;

  if (sectionLoading) {
    return (
      <PageContainer>
        <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading section workspace...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              <span>Lesson Plans Review & Approvals</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review, approve, or reject curriculum lesson plans submitted by teachers for <strong className="text-indigo-600 dark:text-indigo-400">{section?.name || 'Section'}</strong>.
            </p>
          </div>
          <button
            onClick={loadLessonPlans}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <SectionSubNav sectionId={sectionId} activeTab="lesson-plans" />

        {/* KPI Counter Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className={cn(
              "p-4 border rounded-2xl cursor-pointer transition-all shadow-xs",
              filter === 'Pending Approval' ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400"
            )}
            onClick={() => setFilter(filter === 'Pending Approval' ? 'all' : 'Pending Approval')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Pending Review
              </span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{pendingCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Requires Section Head decision</p>
          </div>

          <div 
            className={cn(
              "p-4 border rounded-2xl cursor-pointer transition-all shadow-xs",
              filter === 'Approved' ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400"
            )}
            onClick={() => setFilter(filter === 'Approved' ? 'all' : 'Approved')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Approved & Published
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{approvedCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Visible to enrolled students</p>
          </div>

          <div 
            className={cn(
              "p-4 border rounded-2xl cursor-pointer transition-all shadow-xs",
              filter === 'Rejected' ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-400"
            )}
            onClick={() => setFilter(filter === 'Rejected' ? 'all' : 'Rejected')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Rejected
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{rejectedCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Returned to teacher with notes</p>
          </div>

          <div 
            className={cn(
              "p-4 border rounded-2xl cursor-pointer transition-all shadow-xs",
              filter === 'Draft' ? "border-slate-500 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400"
            )}
            onClick={() => setFilter(filter === 'Draft' ? 'all' : 'Draft')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Teacher Drafts
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{draftCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Unsubmitted teacher work</p>
          </div>
        </div>

        {/* Lesson Plans Grid (Cards) */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold space-y-3">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mx-auto" />
            <p>Fetching section lesson plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No lesson plans found</p>
            <p className="text-xs text-slate-400 mt-1">No plans match the "{filter}" filter for this section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map(plan => {
              const docId = plan.documentId || plan.id;
              const status = plan.recordStatus || 'Draft';
              const teacherName = plan.teacher?.displayName || plan.teacher?.name || 'Faculty Member';
              const teacherInitial = teacherName.charAt(0).toUpperCase();

              const statusColors: Record<string, string> = {
                'Draft': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
                'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
                'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
                'Rejected': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
              };

              return (
                <div 
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowDrawer(true);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-4 group cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Top Row: Status Badge & Lesson Number */}
                    <div className="flex justify-between items-start gap-2">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider",
                        statusColors[status] || statusColors['Draft']
                      )}>
                        {status === 'Pending Approval' ? 'PENDING APPROVAL' : status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono font-medium">
                        {plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : 'Unscheduled'}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {plan.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{plan.subject?.name || 'Subject'}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{plan.section?.code || section?.code || 'Section'}</span>
                      </p>
                    </div>

                    {/* Rejection Alert Box */}
                    {status === 'Rejected' && plan.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-[10px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Revision Notes:</strong>
                          <span className="italic">"{plan.rejectionReason}"</span>
                        </div>
                      </div>
                    )}

                    {/* Learning Objectives & Homework Summaries */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase tracking-wider">LEARNING OBJECTIVES:</span>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed mt-0.5">
                          {plan.objectives || 'No learning objectives specified.'}
                        </p>
                      </div>

                      {plan.homework && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase tracking-wider">HOMEWORK ASSIGNMENT:</span>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed mt-0.5">
                            {plan.homework}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Teacher Profile & Eye Icon Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                        {teacherInitial}
                      </div>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">{teacherName}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        setShowDrawer(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors border-none bg-transparent"
                      title={t('View Details')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slide-over Detail Drawer Panel */}
        {showDrawer && selectedPlan && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end animate-fade-in">
            <div className="absolute inset-0" onClick={() => setShowDrawer(false)} />

            <div 
              data-lenis-prevent="true"
              className={cn(
                "relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right text-xs text-slate-800 dark:text-slate-200 z-10",
                locale === 'ar' ? 'border-r border-slate-200 dark:border-slate-800' : 'border-l border-slate-200 dark:border-slate-800'
              )}
            >
              {/* Drawer Header — Pinned at top */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {t('Lesson Plan Details')}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors border-none bg-transparent"
                  title={t('Close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content Body — Scrollable with native & mouse wheel handling */}
              <div 
                ref={drawerBodyRef}
                onWheel={handleDrawerWheel}
                data-lenis-prevent="true"
                className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5 scrollbar-thin"
              >
                {/* Plan Title & Lesson Number */}
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedPlan.title}</h4>
                  <p className="text-slate-500 font-mono text-xs">Lesson #{selectedPlan.lessonNumber || '1'}</p>
                </div>

                {/* 2-Column Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Subject')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedPlan.subject?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Class Section')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedPlan.section?.code || section?.code || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Syllabus Curriculum')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedPlan.curriculum?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Academic Cycle')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {selectedPlan.academicYear?.name || '2026-2027 Academic Year'} ({selectedPlan.academicTerm?.name || 'Current Term'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Assigned Faculty')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedPlan.teacher?.displayName || selectedPlan.teacher?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('Verification Status')}</span>
                    <strong className={cn(
                      "font-black uppercase text-xs",
                      selectedPlan.recordStatus === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' :
                      selectedPlan.recordStatus === 'Rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    )}>{selectedPlan.recordStatus || 'Draft'}</strong>
                  </div>
                </div>

                {/* Detail Blocks */}
                <div className="space-y-4">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Learning Objectives')}:</span>
                    <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {selectedPlan.objectives || 'No learning objectives specified.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Teaching Methods / Syllabi')}:</span>
                    <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {selectedPlan.teachingMethod || 'No teaching methodology documented.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Homework & Classwork Assignments')}:</span>
                    <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {selectedPlan.homework || 'No homework assigned.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Assessment Criteria')}:</span>
                    <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {selectedPlan.assessmentMethod || 'No assessment method defined.'}
                    </p>
                  </div>

                  {/* Rejection Alert Box inside drawer */}
                  {selectedPlan.recordStatus === 'Rejected' && selectedPlan.rejectionReason && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-200 space-y-1">
                      <span className="font-black block">{t('Section Head Rejection Notes')}:</span>
                      <p className="italic">"{selectedPlan.rejectionReason}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Head Action Module Footer — Pinned at bottom */}
              <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 space-y-3">
                <span className="font-black text-xs text-slate-800 dark:text-white block">{t('Section Head Decision & Status Control')}</span>
                
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleUpdateStatus(selectedPlan.documentId || selectedPlan.id, 'Approved')}
                    disabled={submittingIds[selectedPlan.documentId || selectedPlan.id]}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none",
                      selectedPlan.recordStatus === 'Approved' ? "bg-emerald-700 opacity-90" : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedPlan.recordStatus === 'Approved' ? t('Already Approved') : t('Approve & Publish')}</span>
                  </button>

                  <button
                    onClick={() => {
                      const reason = rejectionReasons[selectedPlan.documentId || selectedPlan.id];
                      if (!reason?.trim()) {
                        toast.error(t('Please enter a rejection reason below before rejecting.'));
                        return;
                      }
                      handleUpdateStatus(selectedPlan.documentId || selectedPlan.id, 'Rejected', reason);
                    }}
                    disabled={submittingIds[selectedPlan.documentId || selectedPlan.id]}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t('Reject Plan')}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={t('Rejection reason / feedback notes for teacher...')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={rejectionReasons[selectedPlan.documentId || selectedPlan.id] || ''}
                  onChange={(e) => setRejectionReasons({ ...rejectionReasons, [selectedPlan.documentId || selectedPlan.id]: e.target.value })}
                />
              </div>

            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
