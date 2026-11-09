import React, { useState } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Settings,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Send,
  Eye,
  Sparkles,
  User,
} from 'lucide-react';
import { Job, QueueItem, AutoApplyConfig, CandidateProfile } from '../types';
import { calculateJobMatch } from '../utils/atsMatcher';

interface AutoApplyQueueProps {
  queue: QueueItem[];
  candidate: CandidateProfile;
  isProcessing: boolean;
  activeProcessingId: string | null;
  onStartQueue: () => void;
  onPauseQueue: () => void;
  onClearQueue: () => void;
  onRemoveItem: (id: string) => void;
  config: AutoApplyConfig;
  setConfig: React.Dispatch<React.SetStateAction<AutoApplyConfig>>;
  onGoToTracker: () => void;
  onGoToJobs?: () => void;
  onSelectJob?: (job: Job) => void;
  onDirectApplySingle?: (job: Job) => void;
  onGoToProfile?: () => void;
}

export const AutoApplyQueue: React.FC<AutoApplyQueueProps> = ({
  queue,
  candidate,
  isProcessing,
  activeProcessingId,
  onStartQueue,
  onPauseQueue,
  onClearQueue,
  onRemoveItem,
  config,
  setConfig,
  onGoToTracker,
  onGoToJobs,
  onSelectJob,
  onDirectApplySingle,
  onGoToProfile,
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const completedCount = queue.filter((item) => item.status === 'completed').length;
  const totalCount = queue.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Engine Status - Black & White */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Antrean Lamaran
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Sistem memproses setiap lowongan satu per satu: menyusun surat lamaran personal dengan Gemini AI, menjawab kuis skrining, dan mengirimkannya ke sistem HR.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-zinc-500 text-[11px]">Profil Aktif:</span>
              <span className="text-zinc-200 font-medium text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                {candidate.fullName} · {candidate.primaryRole}
              </span>
              <span className="text-zinc-400 text-[11px]">({candidate.skills.length} keahlian)</span>
              {onGoToProfile && (
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="text-zinc-400 hover:text-white underline text-[11px] ml-1"
                >
                  Ubah di Profile
                </button>
              )}
            </div>
          </div>

          {/* Master Control Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Pengaturan</span>
            </button>

            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                disabled={isProcessing}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                title="Kosongkan seluruh antrean"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {isProcessing ? (
              <button
                onClick={onPauseQueue}
                className="px-5 py-2 text-xs sm:text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-lg transition-all flex items-center gap-2 shadow-sm"
              >
                <Pause className="w-4 h-4" />
                <span>Jeda Proses</span>
              </button>
            ) : (
              <button
                onClick={onStartQueue}
                disabled={pendingCount === 0}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm ${
                  pendingCount === 0
                    ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    : 'bg-white hover:bg-zinc-200 text-black active:scale-95'
                }`}
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Apply ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Configuration Drawer */}
        {showConfig && (
          <div className="mt-5 pt-5 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Jeda Antar Lamaran (Detik)
              </label>
              <select
                value={config.delaySeconds}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, delaySeconds: Number(e.target.value) }))
                }
                className="w-full bg-black border border-zinc-800 text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value={2}>2 Detik (Cepat / Simulasi)</option>
                <option value={4}>4 Detik (Standar Rekomendasi)</option>
                <option value={8}>8 Detik (Santai & Anti-Spam)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Bahasa Surat Lamaran
              </label>
              <select
                value={config.language}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, language: e.target.value }))
                }
                className="w-full bg-black border border-zinc-800 text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="id">Bahasa Indonesia (Formal)</option>
                <option value="en">English (International)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Gaya Penulisan Cover Letter
              </label>
              <select
                value={config.tone}
                onChange={(e: any) =>
                  setConfig((prev) => ({ ...prev, tone: e.target.value }))
                }
                className="w-full bg-black border border-zinc-800 text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="impactful">Berdampak (Fokus Prestasi)</option>
                <option value="formal">Formal Korporat</option>
                <option value="creative">Modern & Fleksibel</option>
              </select>
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoAnswerQuestions}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, autoAnswerQuestions: e.target.checked }))
                  }
                  className="rounded bg-black border-zinc-800 text-white focus:ring-0"
                />
                <span>Jawab kuis skrining HR via AI</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.attachPortfolio}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, attachPortfolio: e.target.checked }))
                  }
                  className="rounded bg-black border-zinc-800 text-white focus:ring-0"
                />
                <span>Sertakan link portofolio & LinkedIn</span>
              </label>
            </div>
          </div>
        )}

        {/* Progress Bar & Realtime status */}
        {totalCount > 0 && (
          <div className="mt-5 pt-5 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="text-white font-medium">Sedang Memproses Lamaran...</span>
                  </>
                ) : completedCount === totalCount ? (
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Seluruh antrean selesai diproses!
                  </span>
                ) : (
                  <span>Menunggu eksekusi dispatcher</span>
                )}
              </span>

              <span className="font-mono text-zinc-300 tabular-nums">
                {completedCount} dari {totalCount} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Queue items listing */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Antrean lamaran masih kosong</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Buka menu <strong>Jobs</strong> untuk memilih lowongan yang ingin diajukan secara otomatis atau 1-klik.
              </p>
            </div>
            {onGoToJobs && (
              <button
                type="button"
                onClick={onGoToJobs}
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <span>Jelajahi Lowongan di Jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          queue.map((item, index) => {
            const isCurrent = activeProcessingId === item.id;
            const isDone = item.status === 'completed';
            const match = calculateJobMatch(candidate, item.job);

            return (
              <div
                key={item.id}
                className={`bg-zinc-950 border rounded-xl p-4 sm:p-5 transition-all ${
                  isCurrent
                    ? 'border-white bg-zinc-900/40 ring-1 ring-white/20'
                    : isDone
                    ? 'border-zinc-800 opacity-80'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Index badge + Company info */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isDone
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : isCurrent
                          ? 'bg-white text-black animate-pulse'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => onSelectJob && onSelectJob(item.job)}
                          className={`text-sm font-semibold text-white truncate ${
                            onSelectJob ? 'cursor-pointer hover:text-zinc-300' : ''
                          }`}
                          title={onSelectJob ? 'Klik untuk meninjau kualifikasi & surat lamaran' : undefined}
                        >
                          {item.job.title}
                        </h4>
                        <span className="text-xs text-zinc-500">di</span>
                        <span className="text-xs font-medium text-zinc-300">
                          {item.job.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-zinc-900 text-zinc-400 border-zinc-800">
                          {item.job.source}
                        </span>

                        {/* Live Synchronized ATS Match Chip */}
                        <span className="text-[11px] font-mono font-semibold text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                          {match.score}% Match
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-zinc-400">
                        <span>{item.job.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-300 font-mono text-[11px]">{item.job.hrEmail}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-300 font-medium">{item.job.salaryRange}</span>
                      </div>

                      {/* Current live step indicator */}
                      {isCurrent && (
                        <div className="pt-1.5 flex items-center gap-2 text-xs text-white font-medium animate-in fade-in">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>{item.progressStep || 'Memproses kualifikasi & ATS...'}</span>
                        </div>
                      )}

                      {isDone && item.trackingId && (
                        <div className="pt-1 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                          <span className="text-white font-medium">Terkirim Berhasil</span>
                          <span aria-hidden="true">·</span>
                          <span>No. Resi: {item.trackingId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status badge & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <div>
                      {item.status === 'pending' && (
                        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Di antrean
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-xs font-medium text-black bg-white px-2.5 py-1 rounded">
                          Memproses AI...
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="text-xs font-medium text-white flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          Sukses
                        </span>
                      )}
                    </div>

                    {!isProcessing && item.status === 'pending' && (
                      <>
                        {onSelectJob && (
                          <button
                            type="button"
                            onClick={() => onSelectJob(item.job)}
                            className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors whitespace-nowrap"
                            title="Tinjau detail lowongan atau sesuaikan surat lamaran"
                          >
                            Review & Edit
                          </button>
                        )}

                        {onDirectApplySingle && (
                          <button
                            type="button"
                            onClick={() => onDirectApplySingle(item.job)}
                            className="px-2.5 py-1 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded transition-colors whitespace-nowrap flex items-center gap-1 shadow-xs"
                            title="Kirim lamaran ini langsung sekarang tanpa menunggu giliran antrean"
                          >
                            <Send className="w-3 h-3" />
                            <span>Lamar Sekarang</span>
                          </button>
                        )}
                      </>
                    )}

                    {!isProcessing && item.status !== 'processing' && (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-white p-1.5 rounded hover:bg-zinc-900 transition-colors"
                        title="Hapus dari antrean"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Finished Summary Call to Action */}
      {completedCount > 0 && completedCount === totalCount && (
        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle2 className="w-4 h-4 text-white" />
              {completedCount} Lamaran Sukses Dikirimkan!
            </h4>
            <p className="text-xs text-zinc-400">
              Lihat status, rekam jejak pengiriman, dan buat email follow-up di tab Lacak.
            </p>
          </div>

          <button
            onClick={onGoToTracker}
            className="px-4 py-2 text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Buka Lacak Lamaran</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
