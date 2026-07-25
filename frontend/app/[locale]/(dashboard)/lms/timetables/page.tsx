'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { DataTable } from '@/components/ui/DataTable';
import { FormBuilder, type FormFieldDef } from '@/components/ui/FormBuilder';
import { apiClient } from '@/services/api.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { getTimetables } from '@/services/lms.service';
import { toast } from 'sonner';

interface TimetableRecord {
  id: number | string;
  section: string;
  subject: string;
  teacher: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string;
  room: string;
  campus: string;
  academicYear: string;
  academicTerm: string;
  durationMinutes: number;
  recordStatus: string;
  raw: any;
}

export default function TimetablesPage() {
  const [data, setData] = useState<TimetableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const { user } = useAuth();
  const { userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher';

  // Dropdown options states for Add/Edit Form
  const [yearsOptions, setYearsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [termsOptions, setTermsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [sectionsOptions, setSectionsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [subjectsOptions, setSubjectsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [classroomsOptions, setClassroomsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [campusesOptions, setCampusesOptions] = useState<{ label: string; value: string | number }[]>([]);

  const loadTimetables = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      const roleType = userRole ? String(userRole).toLowerCase() : '';

      if (roleType === 'teacher' && user?.profile?.id) {
        params['filters[teacher][id][$eq]'] = user.profile.id;
      } else if (roleType === 'student') {
        const studentSectionIds = user?.profile?.sections?.map((s: any) => s.id) || [];
        if (studentSectionIds.length > 0) {
          params['filters[section][id][$in]'] = studentSectionIds;
        } else {
          params['filters[section][id][$eq]'] = 999999;
        }
      } else if (roleType === 'parent') {
        try {
          const childRes = await apiClient.get('/students', {
            params: { filters: { parents: { id: { $eq: user?.profile?.id } } }, populate: ['sections'] }
          });
          const kids = childRes.data?.data || [];
          const sectionIds: number[] = [];
          kids.forEach((k: any) => {
            k.sections?.forEach((sec: any) => {
              if (sec.id) sectionIds.push(sec.id);
            });
          });
          if (sectionIds.length > 0) {
            params['filters[section][id][$in]'] = sectionIds;
          } else {
            params['filters[section][id][$eq]'] = 999999;
          }
        } catch (e) {
          params['filters[section][id][$eq]'] = 999999;
        }
      }

      const ttRes = await getTimetables(params);
      const items = ttRes?.data || [];

      setData(
        items.map((item: any) => ({
          id: item.id,
          section: item.section?.name || 'N/A',
          subject: item.subject?.name || 'N/A',
          teacher: item.teacher ? (item.teacher.firstName ? `${item.teacher.firstName} ${item.teacher.lastName}` : item.teacher.schoolId || 'N/A') : 'N/A',
          dayOfWeek: item.dayOfWeek || 'Monday',
          timeSlot: `${item.startTime ? item.startTime.substring(0, 5) : ''} - ${item.endTime ? item.endTime.substring(0, 5) : ''}`,
          room: item.classroom?.name || 'N/A',
          campus: item.campus?.name || 'N/A',
          academicYear: item.academicYear?.name || 'N/A',
          academicTerm: item.academicTerm?.name || 'N/A',
          durationMinutes: item.durationMinutes || 0,
          recordStatus: item.recordStatus || 'Active',
          raw: item
        }))
      );
    } catch (e) {
      toast.error('Failed to load timetable slots');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [yearsRes, termsRes, sectionsRes, teachersRes, subjectsRes, classroomsRes, campusesRes] = await Promise.all([
        apiClient.get('/academic-years?pagination[limit]=100'),
        apiClient.get('/academic-terms?pagination[limit]=100'),
        apiClient.get('/sections?pagination[limit]=100'),
        apiClient.get('/teachers?pagination[limit]=100'),
        apiClient.get('/subjects?pagination[limit]=100'),
        apiClient.get('/classrooms?pagination[limit]=100'),
        apiClient.get('/campuses?pagination[limit]=100')
      ]);

      setYearsOptions((yearsRes.data?.data || []).map((y: any) => ({ label: y.name || `Year ${y.id}`, value: y.id })));
      setTermsOptions((termsRes.data?.data || []).map((t: any) => ({ label: t.name || `Term ${t.id}`, value: t.id })));
      setSectionsOptions((sectionsRes.data?.data || []).map((s: any) => ({ label: s.name || `Section ${s.id}`, value: s.id })));
      setTeachersOptions((teachersRes.data?.data || []).map((t: any) => ({ label: t.firstName ? `${t.firstName} ${t.lastName}` : t.schoolId || `Teacher ${t.id}`, value: t.id })));
      setSubjectsOptions((subjectsRes.data?.data || []).map((s: any) => ({ label: s.name || `Subject ${s.id}`, value: s.id })));
      setClassroomsOptions((classroomsRes.data?.data || []).map((c: any) => ({ label: c.name || c.roomNumber || `Room ${c.id}`, value: c.id })));
      setCampusesOptions((campusesRes.data?.data || []).map((c: any) => ({ label: c.name || `Campus ${c.id}`, value: c.id })));
    } catch (err) {
      console.warn('Could not fetch filter options:', err);
    }
  };

  useEffect(() => {
    loadTimetables();
    if (canModify) {
      loadOptions();
    }
  }, [user, userRole]);

  const handleSave = async (formData: any) => {
    const payload = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime.includes(':') && formData.startTime.split(':').length === 2 ? `${formData.startTime}:00.000` : formData.startTime,
      endTime: formData.endTime.includes(':') && formData.endTime.split(':').length === 2 ? `${formData.endTime}:00.000` : formData.endTime,
      durationMinutes: parseInt(formData.durationMinutes) || 0,
      recordStatus: formData.recordStatus || 'Active',
      academicYear: formData.academicYear ? parseInt(formData.academicYear) : null,
      academicTerm: formData.academicTerm ? parseInt(formData.academicTerm) : null,
      section: formData.section ? parseInt(formData.section) : null,
      teacher: formData.teacher ? parseInt(formData.teacher) : null,
      subject: formData.subject ? parseInt(formData.subject) : null,
      classroom: formData.classroom ? parseInt(formData.classroom) : null,
      campus: formData.campus ? parseInt(formData.campus) : null,
    };

    try {
      if (editingItem) {
        await apiClient.put(`/timetable-slots/${editingItem.id}`, { data: payload });
        toast.success('Timetable slot updated successfully');
      } else {
        await apiClient.post('/timetable-slots', { data: payload });
        toast.success('New timetable session scheduled');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      loadTimetables();
    } catch (err: any) {
      toast.error('Failed to save timetable record');
    }
  };

  const handleDelete = async (rows: TimetableRecord[]) => {
    try {
      for (const row of rows) {
        await apiClient.delete(`/timetable-slots/${row.id}`);
      }
      toast.success(`${rows.length} session(s) removed from schedule`);
      loadTimetables();
    } catch (err) {
      toast.error('Failed to delete timetable session');
    }
  };

  const columns: any[] = [
    {
      id: 'dayOfWeek',
      accessorKey: 'dayOfWeek',
      header: 'Day of Week',
      cell: ({ row }: any) => (
        <span className="font-bold text-foreground">{row.original?.dayOfWeek}</span>
      )
    },
    {
      id: 'timeSlot',
      header: 'Time Slot',
      cell: ({ row }: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
          <Clock className="w-3 h-3" /> {row.original?.timeSlot} ({row.original?.durationMinutes} mins)
        </span>
      )
    },
    {
      id: 'section',
      header: 'Class Section',
      cell: ({ row }: any) => (
        <span className="font-semibold">{row.original?.section}</span>
      )
    },
    {
      id: 'subject',
      header: 'Subject',
      cell: ({ row }: any) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-500">{row.original?.subject}</span>
      )
    },
    {
      id: 'teacher',
      header: 'Faculty Member',
      cell: ({ row }: any) => (
        <span className="font-medium text-slate-700 dark:text-slate-350">{row.original?.teacher}</span>
      )
    },
    {
      id: 'room',
      header: 'Room / Hall',
      cell: ({ row }: any) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <MapPin className="w-3 h-3" /> {row.original?.room}
        </span>
      )
    },
    {
      id: 'campus',
      header: 'Campus',
      cell: ({ row }: any) => (
        <span className="text-slate-500 dark:text-slate-400">{row.original?.campus}</span>
      )
    },
    {
      id: 'academicTerm',
      header: 'Term / Year',
      cell: ({ row }: any) => (
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          <p>{row.original?.academicTerm}</p>
          <p className="text-[10px] text-slate-400">{row.original?.academicYear}</p>
        </div>
      )
    },
    {
      id: 'recordStatus',
      accessorKey: 'recordStatus',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original?.recordStatus || 'Active';
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
            status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' :
            status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
          }`}>
            {status}
          </span>
        );
      }
    }
  ];

  const formFields: FormFieldDef[] = [
    {
      name: 'academicYear',
      label: 'Academic Year',
      type: 'select',
      required: true,
      options: yearsOptions,
    },
    {
      name: 'academicTerm',
      label: 'Academic Term',
      type: 'select',
      required: true,
      options: termsOptions,
    },
    {
      name: 'campus',
      label: 'Campus',
      type: 'select',
      required: true,
      options: campusesOptions,
    },
    {
      name: 'section',
      label: 'Class Section',
      type: 'select',
      required: true,
      options: sectionsOptions,
    },
    {
      name: 'teacher',
      label: 'Assigned Teacher',
      type: 'select',
      required: true,
      options: teachersOptions,
    },
    {
      name: 'subject',
      label: 'Subject',
      type: 'select',
      required: true,
      options: subjectsOptions,
    },
    {
      name: 'classroom',
      label: 'Classroom / Venue',
      type: 'select',
      required: true,
      options: classroomsOptions,
    },
    {
      name: 'dayOfWeek',
      label: 'Day of Week',
      type: 'select',
      required: true,
      options: [
        { label: 'Monday', value: 'Monday' },
        { label: 'Tuesday', value: 'Tuesday' },
        { label: 'Wednesday', value: 'Wednesday' },
        { label: 'Thursday', value: 'Thursday' },
        { label: 'Friday', value: 'Friday' },
        { label: 'Saturday', value: 'Saturday' },
        { label: 'Sunday', value: 'Sunday' },
      ],
    },
    {
      name: 'startTime',
      label: 'Start Time',
      type: 'time',
      required: true,
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'time',
      required: true,
    },
    {
      name: 'durationMinutes',
      label: 'Duration (Minutes)',
      type: 'number',
      required: true,
    },
    {
      name: 'recordStatus',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Rescheduled', value: 'Rescheduled' },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Timetables & Class Scheduling"
        description="Schedule academic class sessions, assign faculty instructors, and manage classroom allocations."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadTimetables}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canModify && (
            <button
              onClick={() => {
                const defaultTeacherId = (userRole === 'teacher' && user?.profile?.id) ? user.profile.id : '';
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          )}
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="Search schedule by class section, subject, or teacher..."
        exportFileName="class_timetable.csv"
        onEdit={canModify ? (item: any) => {
          setEditingItem({
            id: item.id,
            academicYear: item.raw?.academicYear?.id || '',
            academicTerm: item.raw?.academicTerm?.id || '',
            campus: item.raw?.campus?.id || '',
            section: item.raw?.section?.id || '',
            teacher: item.raw?.teacher?.id || '',
            subject: item.raw?.subject?.id || '',
            classroom: item.raw?.classroom?.id || '',
            dayOfWeek: item.raw?.dayOfWeek || 'Monday',
            startTime: item.raw?.startTime ? item.raw.startTime.substring(0, 5) : '',
            endTime: item.raw?.endTime ? item.raw.endTime.substring(0, 5) : '',
            durationMinutes: item.raw?.durationMinutes || 45,
            recordStatus: item.raw?.recordStatus || 'Active',
          });
          setIsModalOpen(true);
        } : undefined}
        onDelete={canModify ? (item) => handleDelete([item]) : undefined}
        onBulkDelete={canModify ? (items) => handleDelete(items) : undefined}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-1">
              {editingItem ? 'Edit Timetable Session' : 'Schedule New Class Session'}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Select class section, subject, and time slot allocation below.
            </p>
            <FormBuilder
              fields={formFields}
              initialValues={editingItem || { 
                dayOfWeek: 'Monday', 
                startTime: '08:00',
                endTime: '08:45',
                durationMinutes: 45,
                recordStatus: 'Active',
                teacher: (userRole === 'teacher' && user?.profile?.id) ? user.profile.id : ''
              }}
              onSubmit={handleSave}
              draftKey="timetable_form"
              submitLabel={editingItem ? 'Update Session' : 'Schedule Session'}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
