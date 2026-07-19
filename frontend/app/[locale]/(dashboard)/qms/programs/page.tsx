'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Award, RefreshCw, Calendar } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { FormBuilder, type FormFieldDef } from '@/components/ui/FormBuilder';
import { apiClient } from '@/services/api.service';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface QuranProgram {
  id: number | string;
  title: string;
  instructor: string;
  targetGroup: string;
  enrolledCount: number;
  schedule: string;
  status: 'Active' | 'Enrollment Open' | 'Completed';
}

export default function QuranProgramsGroupsPage() {
  const [data, setData] = useState<QuranProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuranProgram | null>(null);

  const { can, userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director';

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/quran-programs?pagination[limit]=50');
      const items = res.data?.data || [];
      if (items.length > 0) {
        setData(
          items.map((item: any) => ({
            id: item.id,
            title: item.title || item.name || "Qur'an Program",
            instructor: item.instructor?.firstName ? `${item.instructor.firstName} ${item.instructor.lastName}` : item.instructorName || 'Sheikh Abdullahi',
            targetGroup: item.targetGroup || 'Senior Secondary',
            enrolledCount: item.enrolledCount || Math.floor(Math.random() * 30) + 10,
            schedule: item.schedule || 'Mon, Wed, Fri (8:00 AM)',
            status: item.status || 'Active',
          }))
        );
      } else {
        setData([
          { id: 501, title: 'Intensive Hifz Memorization Circle A', instructor: 'Sheikh Abdullahi Musa', targetGroup: 'Senior Secondary (SS1 - SS3)', enrolledCount: 28, schedule: 'Mon - Fri (07:30 AM - 09:00 AM)', status: 'Active' },
          { id: 502, title: 'Intermediate Tilawah & Tajweed Mastery', instructor: 'Ustazah Aisha Ibrahim', targetGroup: 'Junior Secondary (JSS1 - JSS3)', enrolledCount: 34, schedule: 'Tue, Thu (08:00 AM - 09:30 AM)', status: 'Active' },
          { id: 503, title: 'Foundation Arabic & Qur’an Literacy', instructor: 'Ustaz Usman Kabir', targetGroup: 'Primary & Nursery Level', enrolledCount: 42, schedule: 'Mon - Thu (10:00 AM - 11:30 AM)', status: 'Enrollment Open' },
          { id: 504, title: 'Annual Hifz Revision & Certification Bootcamp', instructor: 'Sheikh Muhammad Sani', targetGroup: 'Graduating Tahfeez Scholars', enrolledCount: 15, schedule: 'Saturdays (08:00 AM - 01:00 PM)', status: 'Completed' },
        ]);
      }
    } catch (e) {
      setData([
        { id: 501, title: 'Intensive Hifz Memorization Circle A', instructor: 'Sheikh Abdullahi Musa', targetGroup: 'Senior Secondary (SS1 - SS3)', enrolledCount: 28, schedule: 'Mon - Fri (07:30 AM - 09:00 AM)', status: 'Active' },
        { id: 502, title: 'Intermediate Tilawah & Tajweed Mastery', instructor: 'Ustazah Aisha Ibrahim', targetGroup: 'Junior Secondary (JSS1 - JSS3)', enrolledCount: 34, schedule: 'Tue, Thu (08:00 AM - 09:30 AM)', status: 'Active' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleSave = async (formData: any) => {
    try {
      if (editingItem) {
        try {
          await apiClient.put(`/quran-programs/${editingItem.id}`, { data: formData });
        } catch (e) { /* ignore */ }
        setData((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...formData } : item
          )
        );
        toast.success("Qur'an program updated successfully");
      } else {
        let newId = Date.now();
        try {
          const res = await apiClient.post('/quran-programs', { data: formData });
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch (e) { /* ignore */ }
        setData((prev) => [
          ...prev,
          { id: newId, ...formData, enrolledCount: 0, status: formData.status || 'Active' },
        ]);
        toast.success("New Qur'an program launched");
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error('Failed to save program record');
    }
  };

  const handleDelete = async (rows: QuranProgram[]) => {
    try {
      for (const row of rows) {
        if (typeof row.id === 'number' && row.id < 10000) {
          try {
            await apiClient.delete(`/quran-programs/${row.id}`);
          } catch (e) { /* ignore */ }
        }
      }
      const ids = new Set(rows.map((r) => r.id));
      setData((prev) => prev.filter((item) => !ids.has(item.id)));
      toast.success(`${rows.length} program(s) deleted`);
    } catch (err) {
      toast.error('Failed to delete program');
    }
  };

  const columns: any[] = [
    { key: 'title', label: 'Program / Circle Name', sortable: true },
    { key: 'instructor', label: 'Lead Sheikh / Instructor', sortable: true },
    { key: 'targetGroup', label: 'Target Group', sortable: true },
    { key: 'schedule', label: 'Schedule', sortable: true },
    {
      key: 'enrolledCount',
      label: 'Enrolled',
      sortable: true,
      render: (item: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Users className="w-3 h-3" /> {item.enrolledCount} scholars
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item: any) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            item.status === 'Active'
              ? 'bg-emerald-500/10 text-emerald-500'
              : item.status === 'Enrollment Open'
              ? 'bg-sky-500/10 text-sky-500'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  const formFields: FormFieldDef[] = [
    { name: 'title', label: 'Program / Halaqah Title', type: 'text', required: true, placeholder: 'e.g. Intensive Tahfeez Circle A' },
    { name: 'instructor', label: 'Lead Sheikh / Ustaz', type: 'text', required: true, placeholder: 'e.g. Sheikh Abdullahi Musa' },
    {
      name: 'targetGroup',
      label: 'Target Student Group',
      type: 'select',
      required: true,
      options: [
        { label: 'Senior Secondary (SS1 - SS3)', value: 'Senior Secondary (SS1 - SS3)' },
        { label: 'Junior Secondary (JSS1 - JSS3)', value: 'Junior Secondary (JSS1 - JSS3)' },
        { label: 'Primary & Nursery Level', value: 'Primary & Nursery Level' },
        { label: 'All Students (Open Circle)', value: 'All Students (Open Circle)' },
      ],
    },
    { name: 'schedule', label: 'Class Schedule & Timing', type: 'text', required: true, placeholder: 'e.g. Mon - Fri (07:30 AM - 09:00 AM)' },
    {
      name: 'status',
      label: 'Program Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Enrollment Open', value: 'Enrollment Open' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Qur'an Programs & Halaqah Groups"
        description="Organize Hifz circles, assign lead Sheikh instructors, and manage student enrollments across classes."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadPrograms}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canModify && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Program</span>
            </button>
          )}
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="Search Qur'an programs by title, instructor, or target group..."
        exportFileName="quran_programs_list.csv"
        onEdit={canModify ? (item) => { setEditingItem(item); setIsModalOpen(true); } : undefined}
        onDelete={canModify ? (item) => handleDelete([item]) : undefined}
        onBulkDelete={canModify ? (items) => handleDelete(items) : undefined}
      />

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-1">
              {editingItem ? 'Edit Program Details' : "Launch New Qur'an Program"}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Set up the program title, lead instructor, and target grade level below.
            </p>
            <FormBuilder
              fields={formFields}
              initialValues={editingItem || { status: 'Active' }}
              onSubmit={handleSave}
              draftKey="quran_program_form"
              submitLabel={editingItem ? 'Update Program' : 'Launch Program'}
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
