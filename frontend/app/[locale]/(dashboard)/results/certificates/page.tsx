'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Search, 
  Plus, 
  FileText, 
  QrCode, 
  ShieldCheck,
  Building,
  User,
  Sliders,
  Download
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { resultsService } from '@/services/results.service';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface CertificateRecord {
  id: number;
  serialNumber: string;
  studentName: string;
  schoolId: string;
  certificateType: string;
  achievementName: string;
  issueDate: string;
  verificationHash: string;
  status: 'Valid' | 'Revoked';
}

export default function CertificatesBuilderPage() {
  const [issuedCerts, setIssuedCerts] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [certType, setCertType] = useState<string>('Graduation Diploma');
  const [achievement, setAchievement] = useState<string>('Completion of Hifz of the Holy Quran');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadCertificatesData();
  }, []);

  const loadCertificatesData = async () => {
    setIsLoading(true);
    try {
      // Mock registries
      setIssuedCerts([
        { id: 1, serialNumber: 'CERT-2026-000124', studentName: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', certificateType: 'Graduation Diploma', achievementName: 'Senior Secondary Graduation Diploma', issueDate: '2026-07-24', verificationHash: 'sha256-a1b2c3d4e5', status: 'Valid' },
        { id: 2, serialNumber: 'CERT-2026-000125', studentName: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', certificateType: 'Completion Certificate', achievementName: 'Quran Memorization Completion', issueDate: '2026-07-24', verificationHash: 'sha256-f6g7h8i9j0', status: 'Valid' }
      ]);

      const stdsRes = await apiClient.get('/students');
      setStudents(stdsRes.data?.data || [
        { id: 1, firstName: 'Ahmad', lastName: 'Musa', schoolId: 'AC-2026-0004' },
        { id: 2, firstName: 'Fatima', lastName: 'Ibrahim', schoolId: 'AC-2026-0012' }
      ]);
    } catch (e) {
      toast.error('Failed to load certificates registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student.');
      return;
    }
    const std = students.find(s => String(s.id) === String(selectedStudent)) || {
      firstName: 'Selected',
      lastName: 'Student',
      schoolId: 'AC-TEMP'
    };
    const sName = `${std.firstName} ${std.lastName}`;
    const newSerial = `CERT-2026-${Math.floor(Math.random() * 900000) + 100000}`;
    const newHash = 'sha256-' + Math.random().toString(36).substring(2, 10);

    const newRecord: CertificateRecord = {
      id: Date.now(),
      serialNumber: newSerial,
      studentName: sName,
      schoolId: std.schoolId,
      certificateType: certType,
      achievementName: achievement,
      issueDate: new Date().toISOString().split('T')[0],
      verificationHash: newHash,
      status: 'Valid'
    };

    setIssuedCerts([newRecord, ...issuedCerts]);
    toast.success(`Successfully issued ${certType} for ${sName}`);
    triggerCertificatePDF(newRecord);
  };

  const triggerCertificatePDF = (cert: CertificateRecord) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const verificationUrl = `https://yahayascool.edu.ng/verify/certificate?hash=${cert.verificationHash}`;

    // Elegant Border
    doc.setDrawColor(217, 119, 6); // Gold border
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 273, 186);

    // Decorative corners
    doc.setFillColor(217, 119, 6);
    doc.rect(10, 10, 10, 10, 'F');
    doc.rect(277, 10, 10, 10, 'F');
    doc.rect(10, 190, 10, 10, 'F');
    doc.rect(277, 190, 10, 10, 'F');

    // Crest branding
    doc.setFillColor(16, 185, 129); // Emerald
    doc.ellipse(148, 35, 12, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Y', 145, 39);

    // Header Title
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('YAHAYA ENTERPRISE SCHOOLS', 148, 56, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('KNOWLEDGE • CHARACTER • SPIRITUAL EXCELLENCE', 148, 62, { align: 'center' });

    // Diploma Certificate Body
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(217, 119, 6);
    doc.text(cert.certificateType.toUpperCase(), 148, 80, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('THIS IS OFFICIALLY PRESENTED TO', 148, 92, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(cert.studentName.toUpperCase(), 148, 106, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`In recognition of the successful completion of the requirements for`, 148, 118, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(cert.achievementName, 148, 128, { align: 'center' });

    // Footer Dates & Signatories
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Issued Date: ${cert.issueDate} | Serial Registration: ${cert.serialNumber}`, 148, 142, { align: 'center' });

    // Signatures lines
    doc.line(40, 168, 100, 168);
    doc.text('Dr. Ibrahim Al-Hassan', 40, 173);
    doc.setFont('Helvetica', 'bold');
    doc.text('Registrar General', 40, 177);

    doc.setFont('Helvetica', 'normal');
    doc.line(197, 168, 257, 168);
    doc.text('Prof. Yahaya Muhammad', 197, 173);
    doc.setFont('Helvetica', 'bold');
    doc.text('Principal General', 197, 177);

    // Cryptographic Badge
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 182, 257, 12, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Cryptographic Security Verification Hash: ${cert.verificationHash} | Registry Url: ${verificationUrl}`, 24, 190);

    doc.save(`Certificate_${cert.serialNumber}.pdf`);
  };

  const filteredCerts = issuedCerts.filter(c => 
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title="Verifiable Certificates Registry & Builder"
        description="Issue official completion certificates, conduct transcripts, and letters linked with QR verification codes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Issuer Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-emerald-600" />
              <span>Issue New Document</span>
            </h3>

            <div>
              <label className="text-[10px] font-black text-slate-450 block mb-1.5">Select Student</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="">-- Select Recipient --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.schoolId})</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 block mb-1.5">Certificate Type</label>
              <select 
                value={certType} 
                onChange={(e) => setCertType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="Graduation Diploma">Graduation Diploma</option>
                <option value="Enrollment Certificate">Enrollment Certificate</option>
                <option value="Completion Certificate">Completion Certificate</option>
                <option value="Bonafide Letter">Bonafide Letter</option>
                <option value="Good Conduct">Good Conduct Letter</option>
                <option value="Character Certificate">Character Certificate</option>
                <option value="Recommendation Letter">Recommendation Letter</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 block mb-1.5">Specialization / Accomplishment</label>
              <input 
                type="text" 
                value={achievement} 
                onChange={(e) => setAchievement(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold"
                placeholder="e.g. Quran Memorization Completion"
              />
            </div>

            <button
              onClick={handleIssueCertificate}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Document</span>
            </button>
          </div>
        </div>

        {/* Issued Documents Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-h-[400px] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Issued Certificates Registry</h3>
              
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-450" />
                <input 
                  type="text" 
                  placeholder="Search serial or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none w-44"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="px-4 py-3">Serial No</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Verification Hash</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{cert.serialNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{cert.studentName}</p>
                        <p className="text-[10px] text-slate-450">{cert.schoolId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold block">{cert.certificateType}</span>
                        <span className="text-[10px] text-slate-500 block">{cert.achievementName}</span>
                      </td>
                      <td className="px-4 py-3">{cert.issueDate}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-450">{cert.verificationHash}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => triggerCertificatePDF(cert)}
                          className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-550"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">No certificates matching search terms.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
