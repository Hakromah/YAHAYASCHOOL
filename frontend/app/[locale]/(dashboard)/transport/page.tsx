'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus, MapPin, Users, Fuel, Plus, Eye, Navigation, ShieldCheck, FileText
} from 'lucide-react';
import { transportService } from '@/services/transport.service';
import type { TransportVehicle, TransportRoute, StudentTransportAssignment } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, r, a] = await Promise.all([
        transportService.getVehicles(),
        transportService.getRoutes(),
        transportService.getStudentAssignments()
      ]);
      setVehicles(v);
      setRoutes(r);
      setAssignments(a);
    } catch {
      toast.error('Failed to load transport fleet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      return !query || 
        a.studentName.toLowerCase().includes(query.toLowerCase()) || 
        a.routeName.toLowerCase().includes(query.toLowerCase()) ||
        a.stopName.toLowerCase().includes(query.toLowerCase());
    });
  }, [assignments, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);

    return [
      {
        id: 'fleet_vehicles',
        title: 'Active Fleet Vehicles',
        value: `${vehicles.length} Buses`,
        subtitle: `${totalCapacity} Total Passenger Seats`,
        trendDirection: 'up',
        icon: <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'active_routes',
        title: 'Active Shuttle Routes',
        value: `${routes.length} Routes`,
        subtitle: 'Covering Monrovia & Suburban Campuses',
        trendDirection: 'neutral',
        icon: <Navigation className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'transport_students',
        title: 'Assigned Transport Scholars',
        value: assignments.length.toString(),
        subtitle: 'Automated GPS & Pickup Confirmation',
        trendDirection: 'up',
        icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'transport_revenue',
        title: 'Transport Revenue (YTD)',
        value: '$350.00',
        subtitle: 'Auto-Invoiced via Finance ERP',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [vehicles, routes, assignments]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'assignmentNumber',
        header: 'Assignment & Scholar',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{a.assignmentNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm">
                {a.studentName}
              </p>
              <span className="font-mono text-xs text-slate-500">{a.schoolId}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'routeName',
        header: 'Route & Bus Stop',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.routeName}</span>
            <span className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> Stop: {row.original.stopName}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'pickupTime',
        header: 'Schedule (Pickup / Drop)',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold block">
            {row.original.pickupTime} / {row.original.dropTime}
          </span>
        )
      },
      {
        accessorKey: 'termFee',
        header: 'Transport Fee',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">${row.original.termFee.toFixed(2)} / term</span>
            <span className="text-[11px] text-slate-500">Invoice: {row.original.invoiceId || 'N/A'}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            Inspect
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Transport & Fleet Logistics ERP"
      description="School shuttle route management, student pickup/drop manifests, fleet maintenance, fuel logs, and automated Finance ERP transport fee billing."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Transport Management' }]}
      icon={<Bus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredAssignments.length}
      recordLabel="Route Assignments"
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await transportService.logFuelExpense('LBR-BUS-104', 'Mohammed Kanneh', 45, 1.35);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Log Fuel</span>
          </button>
          <button
            onClick={async () => {
              await transportService.assignStudentToRoute('2', 'Mariama Diallo', 'AC00000002', 'RT-02', 'Bushrod & Virginia Route', 'Duala Market Stop');
              loadData();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Assign Route</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search transport assignments by student name, route, stop..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredAssignments}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
      />

      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.studentName,
          id: selectedRow.assignmentNumber,
          role: `${selectedRow.routeName} (${selectedRow.stopName})`,
          status: selectedRow.status,
          email: selectedRow.schoolId,
          balance: `$${selectedRow.termFee.toFixed(2)} (Invoice ${selectedRow.invoiceId || 'N/A'})`
        } : null}
        category="transport"
      />
    </EnterpriseModuleShell>
  );
}
