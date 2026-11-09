import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Globe,
  Plus,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { PortalConnection, Job } from '../types';

interface PortalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  portals: PortalConnection[];
  onTriggerSync: (selectedPortalNames: string[]) => Promise<void>;
  onImportExtractedJob: (job: Job) => void;
  isSyncing: boolean;
}

export const PortalSyncModal: React.FC<PortalSyncModalProps> = ({
  isOpen,
  onClose,
  portals,
  onTriggerSync,
  onImportExtractedJob,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'urlImport'>('integrations');
  const [selectedPortals, setSelectedPortals] = useState<string[]>(['Glints', 'JobStreet', 'LinkedIn']);
  const [inputUrl, setInputUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedJob, setExtractedJob] = useState<Job | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePortal = (name: string) => {
    if (selectedPortals.includes(name)) {
      if (selectedPortals.length > 1) {
        setSelectedPortals(selectedPortals.filter((p) => p !== name));
      }
    } else {
      setSelectedPortals([...selectedPortals, name]);
    }
  };

  const handleRunSync = async () => {
    await onTriggerSync(selectedPortals);
  };

  const handleExtractFromUrl = async () => {
    if (!inputUrl && !rawText) {
      setExtractError('Silakan masukkan link URL lowongan atau tempel teks lowongan.');
      return;
    }

    setExtractError(null);
    setIsExtracting(true);
    setExtractedJob(null);

    try {
      const res = await fetch('/api/portals/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          rawText: rawText,
        }),
      });

      const data = await res.json();
      if (data.job) {
        const jobWithId: Job = {
          ...data.job,
          id: 'imported-' + Date.now().toString(36),
          companyInitial: (data.job.company || 'CO').substring(0, 2).toUpperCase(),
          logoBg: 'bg-zinc-800',
        };
        setExtractedJob(jobWithId);
      } else {
        setExtractError(data.error || 'Gagal mengekstrak informasi lowongan.');
      }
    } catch (err: any) {
      setExtractError(err.message || 'Terjadi kesalahan saat memproses data portal.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmImport = () => {
    if (extractedJob) {
      onImportExtractedJob(extractedJob);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto animate-in fade-in duration-150">
        {/* Header - Monochrome */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white">Pusat Integrasi Portal Kerja</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Sinkronisasi Glints & JobStreet
            </h3>
            <p className="text-xs text-zinc-400">
              Hubungkan radar dan otomatisasi lamaran langsung dengan portal lowongan terkemuka.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-black p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Status Portal & Live Sync
          </button>
          <button
            onClick={() => setActiveTab('urlImport')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'urlImport'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ekstrak dari Link Portal</span>
          </button>
        </div>

        {/* Tab 1: Connected Portals & Live Sync */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {portals.map((portal) => {
                const isSelected = selectedPortals.includes(portal.sourceType);
                return (
                  <div
                    key={portal.id}
                    className={`bg-black p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      isSelected ? 'border-zinc-600 bg-zinc-900/30' : 'border-zinc-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs bg-zinc-900 border border-zinc-700">
                        {portal.logoText}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs sm:text-sm">
                            {portal.name}
                          </span>
                          <span className="text-[11px] text-zinc-300 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" /> Terhubung
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span>{portal.jobCount} lowongan tersinkron</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px]">{portal.lastSync}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <a
                        href={portal.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-900 transition-colors"
                        title={`Kunjungi ${portal.name}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => togglePortal(portal.sourceType)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-white text-black font-semibold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {isSelected ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-black p-3.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>
                Data lowongan dari Glints dan JobStreet otomatis diselaraskan dengan parameter profil Anda. Setiap berkas lamaran disiapkan dengan format yang kompatibel dengan sistem rekrutmen masing-masing portal.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleRunSync}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan Feed...' : 'Tarik Feed Lowongan Terbaru'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Extract from Glints / JobStreet URL */}
        {activeTab === 'urlImport' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-medium">
                Tautan (URL) Lowongan Kerja dari Glints / JobStreet / LinkedIn
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://glints.com/id/opportunities/jobs/... atau https://www.jobstreet.co.id/id/job/..."
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Mendukung tautan resmi Glints, JobStreet, Kalibrr, dan LinkedIn.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-medium">
                Atau Tempel Salinan Deskripsi Lowongan (Opsional)
              </label>
              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Jika halaman lowongan memerlukan login, salin dan tempel teks deskripsi lowongan di sini..."
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none font-normal"
              />
            </div>

            {extractError && (
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs">
                {extractError}
              </div>
            )}

            <button
              onClick={handleExtractFromUrl}
              disabled={isExtracting}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span>{isExtracting ? 'Gemini AI sedang membaca konten lowongan...' : 'Ekstrak Otomatis dengan AI'}</span>
            </button>

            {/* Extracted Preview */}
            {extractedJob && (
              <div className="p-4 bg-black rounded-xl border border-zinc-700 space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-white font-mono flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Berhasil Diekstrak ({extractedJob.source})
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{extractedJob.title}</h4>
                    <p className="text-xs text-zinc-400">
                      {extractedJob.company} · {extractedJob.location} · {extractedJob.salaryRange}
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-zinc-900 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700">
                    {extractedJob.portalRefId}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {extractedJob.skills.slice(0, 6).map((s, idx) => (
                    <span key={idx} className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono border border-zinc-800">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan ke Antrean</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
