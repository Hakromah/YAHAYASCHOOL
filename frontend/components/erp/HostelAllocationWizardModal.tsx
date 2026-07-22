/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { erpService } from '@/services/erp.service';
import { hostelService } from '@/services/hostel.service';
import type { HostelBedAllocation, HostelBuilding, HostelRoom } from '@/types/enterprise.types';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Building,
  Check,
  CheckCircle2,
  Phone,
  Search,
  ShieldAlert,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface HostelAllocationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAllocation: HostelBedAllocation) => void;
}

export function HostelAllocationWizardModal({ isOpen, onClose, onSuccess }: HostelAllocationWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Student Selection
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Step 2: Building Selection
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<HostelBuilding | null>(null);

  // Step 3: Room & Bed Selection
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [selectedBedNumber, setSelectedBedNumber] = useState('Bed A');

  // Step 4: Financial Summary
  const [termFeeUSD, setTermFeeUSD] = useState(250.00);
  const [depositUSD, setDepositUSD] = useState(50.00);

  // Live search for students
  useEffect(() => {
    if (!studentSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await erpService.getStudents({ query: studentSearch, page: 1, pageSize: 5 });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [studentSearch]);

  // Load buildings initially
  useEffect(() => {
    const initData = async () => {
      try {
        const blds = await hostelService.getBuildings();
        setBuildings(blds);
        setSelectedBuilding(blds[0] || null);

        const rms = await hostelService.getRooms(blds[0]?.id || 'BLD-01');
        setRooms(rms);
        setSelectedRoom(rms[0] || null);
      } catch {
        toast.error('Failed to load master data for wizard.');
      }
    };
    if (isOpen) initData();
  }, [isOpen]);

  // Load rooms dynamically based on building selection
  useEffect(() => {
    const loadRoomsForBuilding = async () => {
      if (!selectedBuilding) return;
      try {
        const rms = await hostelService.getRooms(selectedBuilding.id);
        setRooms(rms);
        setSelectedRoom(rms[0] || null);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      }
    };
    loadRoomsForBuilding();
  }, [selectedBuilding]);

  // Eligibility check memo
  const eligibility = useMemo(() => {
    if (!selectedStudent) return null;
    const isGenderMatch = selectedBuilding ? (selectedStudent.gender === (selectedBuilding.genderAllowed === 'male' ? 'male' : 'female')) : true;
    const isActive = selectedStudent.enrollmentStatus === 'active';
    const noDisciplinary = (selectedStudent.disciplinaryFlags?.length || 0) === 0;
    const noBalance = (selectedStudent.outstandingBalanceUSD || 0) === 0;

    return {
      isGenderMatch,
      isActive,
      noDisciplinary,
      noBalance,
      eligible: isGenderMatch && isActive && noDisciplinary && noBalance
    };
  }, [selectedStudent, selectedBuilding]);

  if (!isOpen) return null;

  const selectStudent = (student: any) => {
    setSelectedStudent({
      id: student.documentId || student.id,
      name: student.name || `${student.firstName} ${student.lastName}`,
      schoolId: student.schoolId || student.admissionNumber || String(student.id),
      gender: student.gender || 'male',
      enrollmentStatus: student.enrollmentStatus || 'active',
      programName: student.programs?.[0]?.name || student.programName || 'Grade 9 - Senior STEM',
      guardianName: student.parents?.[0]?.name || student.guardianName || 'Guardian',
      guardianPhone: student.parents?.[0]?.phone || student.guardianPhone || '',
      scholarshipPercentage: student.scholarshipGrantedPercentage || 0,
      outstandingBalanceUSD: student.outstandingBalance || student.outstandingBalanceUSD || 0,
      medicalAlerts: student.medicalInfo?.allergies || student.medicalAlerts || [],
      disciplinaryFlags: student.behaviorRecords || []
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedStudent) {
      toast.error('Please select a student.');
      return;
    }
    if (currentStep === 2 && !selectedBuilding) {
      toast.error('Please select a boarding hall.');
      return;
    }
    if (currentStep === 2 && eligibility && !eligibility.isGenderMatch) {
      toast.error('Building gender eligibility mismatch. Please check candidate gender.');
      return;
    }
    if (currentStep === 3 && !selectedRoom) {
      toast.error('Please select a room and bed.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const allocation = await hostelService.allocateBedWithWizard({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        schoolId: selectedStudent.schoolId,
        gender: selectedStudent.gender || 'male',
        programName: selectedStudent.programName || 'Grade 9 STEM',
        guardianName: selectedStudent.guardianName || 'Parent',
        guardianPhone: selectedStudent.guardianPhone || '+231 886 000 000',
        buildingName: selectedBuilding?.name || 'Al-Farooq Boarding Hall',
        roomNumber: selectedRoom?.roomNumber || '101',
        bedNumber: selectedBedNumber,
        termFee: termFeeUSD,
        securityDeposit: depositUSD,
        medicalInfo: {
          allergies: selectedStudent.medicalAlerts || [],
          chronicConditions: [],
          emergencyCarePlan: 'Standard Boarding Protocol',
          isolationRequired: false,
          hospitalVisitsCount: 0,
          doctorContact: '+231 886 900 111'
        }
      });
      onSuccess(allocation);
      onClose();
    } catch {
      toast.error('Allocation wizard failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm">
              Step {currentStep} / 5
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Hostel Allocation Wizard</h2>
              <p className="text-xs text-slate-500">SIS Linkage & Automatic Finance GL Posting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator Bar */}
        <div className="grid grid-cols-5 gap-1.5 py-4">
          {[
            { step: 1, label: 'Student' },
            { step: 2, label: 'Building' },
            { step: 3, label: 'Room & Bed' },
            { step: 4, label: 'Financials' },
            { step: 5, label: 'Agreement' },
          ].map((s) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all ${s.step <= currentStep ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">

          {/* STEP 1: SELECT STUDENT */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150 relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search existing student by name or school ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />

                {isSearching && (
                  <div className="absolute right-3 top-3 text-xs text-slate-400">Searching...</div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          selectStudent(st);
                          setSearchResults([]);
                          setStudentSearch('');
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-700"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-950 dark:text-white">{st.firstName} {st.lastName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{st.schoolId || st.admissionNumber}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          {st.gender}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student SIS Card Preview */}
              {selectedStudent ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-base">
                      {selectedStudent.name.split(' ').map((w: any) => w.charAt(0)).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{selectedStudent.name}</h4>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedStudent.schoolId}</span>
                      <span className="text-xs text-slate-500 ml-2">| {selectedStudent.programName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Guardian: {selectedStudent.guardianName}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Scholarship: {selectedStudent.scholarshipPercentage}% Aid
                    </div>
                  </div>

                  {selectedStudent.medicalAlerts?.length > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Medical Alerts: {selectedStudent.medicalAlerts.join(', ')}</span>
                    </div>
                  )}

                  {/* Eligibility checks */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <h5 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">ERP Eligibility Checks:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${eligibility?.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>Status: {eligibility?.isActive ? 'Active Student' : 'Inactive'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${eligibility?.noDisciplinary ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>Discipline: {eligibility?.noDisciplinary ? 'No Blocks' : 'Disciplinary Block'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${eligibility?.noBalance ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>Balance: {eligibility?.noBalance ? 'Clear' : 'Has Outstanding Balance'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${eligibility?.isGenderMatch ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>Gender Match: {eligibility?.isGenderMatch ? 'Verified' : 'Mismatch'}</span>
                      </div>
                    </div>
                    {!eligibility?.eligible && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-[10px] text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Warning: Student does not meet all eligibility criteria. Proceed with caution.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Please search and select a student profile from the SIS directory above.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHOOSE BUILDING */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-slate-500 font-semibold mb-2">Select boarding hall based on scholar s gender eligibility ({selectedStudent.gender.toUpperCase()}):</p>
              {buildings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBuilding(b);
                    setTermFeeUSD(b.genderAllowed === 'female' ? 260 : 250);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedBuilding?.id === b.id
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{b.name}</h4>
                      <p className="text-xs text-slate-500">Warden: {b.supervisorName} | {b.totalRooms} Rooms ({b.totalBeds} Beds)</p>
                    </div>
                  </div>
                  {selectedBuilding?.id === b.id && <Check className="w-5 h-5 text-indigo-600" />}
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: CHOOSE ROOM & BED */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-slate-500 font-semibold mb-2">Available Rooms in {selectedBuilding?.name}:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedRoom(r);
                      setTermFeeUSD(r.termFee);
                      setDepositUSD(r.securityDeposit);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${selectedRoom?.id === r.id
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">Room {r.roomNumber}</span>
                      <span className="text-xs font-bold text-indigo-600 capitalize">{r.roomType}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Occupancy: {r.occupiedBeds}/{r.capacity} Beds ({r.availableBeds} Available)</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 font-bold">${r.termFee}/term</span>
                      <span className="text-slate-400">Assets: {r.assets?.length || 3} items</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRoom && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Available Bed Designation:</label>
                  <div className="flex items-center gap-2">
                    {['Bed A', 'Bed B', 'Bed C', 'Bed D'].slice(0, selectedRoom.capacity).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBedNumber(b)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${selectedBedNumber === b
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: FINANCIAL SUMMARY */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <span>Hostel Accommodation Fee (Term 1)</span>
                  <span className="font-mono text-sm">${termFeeUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <span>Refundable Security Deposit (GL 2050 Liability)</span>
                  <span className="font-mono font-bold">${depositUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>Scholarship Subsidy ({selectedStudent.scholarshipPercentage}%)</span>
                  <span className="font-mono">-${((termFeeUSD * selectedStudent.scholarshipPercentage) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-black text-sm text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-600">
                  <span>Total Amount Invoiced to AR Ledger</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ${(termFeeUSD + depositUSD - ((termFeeUSD * selectedStudent.scholarshipPercentage) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: APPROVAL & AGREEMENT */}
          {currentStep === 5 && (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Ready for Allocation Execution</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Clicking confirm will execute the Hostel Agreement, create Finance Fee Invoice, auto-post GL entries, and issue the QR Check-in Card.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Executing Allocation & GL...' : 'Confirm Allocation & Post GL'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
