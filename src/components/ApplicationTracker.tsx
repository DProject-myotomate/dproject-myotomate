import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Search,
  Mail,
  Eye,
  Trash2,
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus, CandidateProfile } from '../types';
import { FollowUpModal } from './FollowUpModal';

interface ApplicationTrackerProps {
  applications: ApplicationRecord[];
  candidate: CandidateProfile;
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteRecord: (id: string) => void;
  onGoToRadar: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  candidate,
  onUpdateStatus,
  onDeleteRecord,
  onGoToRadar,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedForDetail, setSelectedForDetail] = useState<ApplicationRecord | null>(null);
  const [selectedForFollowUp, setSelectedForFollowUp] = useState<ApplicationRecord | null>(null);

  // Computed metrics
  const totalApplied = applications.length;
  const inReview = applications.filter((a) => a.status === 'Ditinjau HR').length;
  const inInterview = applications.filter((a) => a.status === 'Wawancara').length;
  const avgMatch =
    totalApplied > 0
      ? Math.round(applications.reduce((acc, a) => acc + (a.matchScore || 75), 0) / totalApplied)
      : 0;

  // Filtered rows
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        search === '' ||
        app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.trackingId.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filterStatus === 'all' || app.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [applications, search, filterStatus]);

  // Export to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = [
      'No. Resi',
      'Perusahaan',
      'Posisi',
      'Lokasi',
      'Email HR',
      'Tanggal Kirim',
      'Skor ATS (%)',
      'Status',
      'Metode Pengiriman',
    ];
    const rows = applications.map((a) => [
      `"${(a.trackingId || '').replace(/"/g, '""')}"`,
      `"${(a.company || '').replace(/"/g, '""')}"`,
      `"${(a.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(a.location || '').replace(/"/g, '""')}"`,
      `"${(a.hrEmail || '').replace(/"/g, '""')}"`,
      `"${(a.appliedAt || '').replace(/"/g, '""')}"`,
      `"${a.matchScore}%"`,
      `"${(a.status || '').replace(/"/g, '""')}"`,
      `"${(a.deliveryMethod || 'Direct Email').replace(/"/g, '""')}"`,
    ]);

    // Use UTF-8 BOM (\uFEFF) for seamless Excel & Google Sheets compatibility
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Riwayat_Lamaran_MyOtomate_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'Wawancara':
        return 'text-white bg-zinc-800 border-zinc-500 font-semibold';
      case 'Penawaran':
        return 'text-white bg-white text-black font-semibold';
      case 'Ditinjau HR':
        return 'text-zinc-200 bg-zinc-900 border-zinc-700';
      case 'Ditolak':
        return 'text-zinc-500 bg-zinc-950 border-zinc-800';
      default:
        return 'text-zinc-300 bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar with primary 'Ekspor ke CSV' action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Lacak Riwayat Lamaran
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Pantau status proses rekrutmen, jadwal interview, dan unduh riwayat berkas Anda.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={applications.length === 0}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm shrink-0 ${
            applications.length === 0
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-white hover:bg-zinc-200 text-black active:scale-95'
          }`}
          title={
            applications.length === 0
              ? 'Belum ada riwayat lamaran untuk diekspor'
              : 'Unduh seluruh riwayat lamaran sebagai file CSV'
          }
        >
          <Download className="w-4 h-4" />
          <span>Ekspor ke CSV</span>
        </button>
      </div>

      {/* 4-Column KPI Strip - Monochrome Black & White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-zinc-400 block">Total Lamaran Terkirim</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {totalApplied}
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Seluruh riwayat aktif</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-zinc-400 block">Sedang Ditinjau HR</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {inReview}
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Review berkas awal</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-zinc-400 block">Undangan Wawancara</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {inInterview}
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Tahap wawancara user</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-zinc-400 block">Rata-rata Skor Match ATS</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {avgMatch}%
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Tingkat keselarasan CV</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan perusahaan, posisi, atau nomor resi pelacakan..."
            className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
          >
            <option value="all">Semua Status</option>
            <option value="Terkirim">Terkirim</option>
            <option value="Ditinjau HR">Ditinjau HR</option>
            <option value="Wawancara">Wawancara</option>
            <option value="Penawaran">Penawaran</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
              applications.length === 0
                ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                : 'text-black bg-white hover:bg-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor ke CSV</span>
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">Belum ada riwayat lamaran</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Semua lamaran yang dikirimkan melalui sistem antrean otomatis atau 1-klik akan tercatat di sini lengkap dengan nomor resi dan salinan berkas.
            </p>
            <button
              onClick={onGoToRadar}
              className="text-xs font-semibold text-white hover:underline pt-1"
            >
              Buka Katalog Jobs &rarr;
            </button>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white truncate">
                      {app.jobTitle}
                    </h3>
                    <span className="text-xs text-zinc-500">di</span>
                    <span className="text-xs font-semibold text-zinc-200">{app.company}</span>
                  </div>

                  {/* Clean unboxed metadata with separators (§1.A) */}
                  <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300 text-[11px]">{app.trackingId}</span>
                    <span aria-hidden="true">·</span>
                    <span>{app.hrEmail}</span>
                    <span aria-hidden="true">·</span>
                    <span>Terkirim: {app.appliedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-white font-medium">
                      Match: {app.matchScore}%
                    </span>
                  </div>
                </div>

                {/* Right: Status selector & action buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium focus:outline-none cursor-pointer ${getStatusColor(
                      app.status
                    )}`}
                  >
                    <option value="Terkirim">Terkirim</option>
                    <option value="Ditinjau HR">Ditinjau HR</option>
                    <option value="Wawancara">Wawancara</option>
                    <option value="Penawaran">Penawaran</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>

                  {/* View Details */}
                  <button
                    onClick={() => setSelectedForDetail(app)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Berkas</span>
                  </button>

                  {/* Follow-up email template */}
                  <button
                    onClick={() => setSelectedForFollowUp(app)}
                    className="px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Follow-Up</span>
                  </button>

                  {/* Delete record */}
                  <button
                    onClick={() => onDeleteRecord(app.id)}
                    className="text-zinc-500 hover:text-white p-1.5 rounded hover:bg-zinc-900 transition-colors"
                    title="Hapus riwayat lamaran ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Application Modal */}
      {selectedForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {selectedForDetail.jobTitle}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedForDetail.company} · ID: {selectedForDetail.trackingId}
                </p>
              </div>
              <button
                onClick={() => setSelectedForDetail(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
              >
                &times;
              </button>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Surat Lamaran (Cover Letter) yang Dikirimkan
              </h4>
              <div className="bg-black p-3.5 rounded-lg border border-zinc-800 max-h-60 overflow-y-auto text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
                {selectedForDetail.coverLetter}
              </div>
            </div>

            {selectedForDetail.screeningAnswers && selectedForDetail.screeningAnswers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Jawaban Skrining HR
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedForDetail.screeningAnswers.map((item, idx) => (
                    <div key={idx} className="bg-black p-2.5 rounded border border-zinc-800 text-xs">
                      <span className="font-semibold text-zinc-300 block">{item.question}</span>
                      <span className="text-zinc-400 block mt-1">{item.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedForDetail(null)}
                className="px-4 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {selectedForFollowUp && (
        <FollowUpModal
          application={selectedForFollowUp}
          candidate={candidate}
          isOpen={true}
          onClose={() => setSelectedForFollowUp(null)}
        />
      )}
    </div>
  );
};
