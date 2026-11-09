import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { Job, CandidateProfile, WorkMode } from '../types';
import { calculateJobMatch } from '../utils/atsMatcher';

interface JobRadarProps {
  jobs: Job[];
  candidate: CandidateProfile;
  queueJobIds: Set<string>;
  appliedJobIds: Set<string>;
  onSelectJob: (job: Job) => void;
  onAddJobToQueue: (job: Job) => void;
  onAddMultipleToQueue: (jobs: Job[]) => void;
  onOpenCustomJobModal: () => void;
  onOpenPortalSyncModal: () => void;
  onNavigateToTab?: (tab: 'jobs' | 'queue' | 'tracker' | 'profile') => void;
}

export const JobRadar: React.FC<JobRadarProps> = ({
  jobs,
  candidate,
  queueJobIds,
  appliedJobIds,
  onSelectJob,
  onAddJobToQueue,
  onAddMultipleToQueue,
  onOpenCustomJobModal,
  onOpenPortalSyncModal,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<string>('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'newest'>('match');
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());

  // Compute matches and filter
  const enrichedJobs = useMemo(() => {
    return jobs.map((job) => {
      const match = calculateJobMatch(candidate, job);
      return {
        ...job,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      };
    });
  }, [jobs, candidate]);

  const filteredJobs = useMemo(() => {
    return enrichedJobs
      .filter((job) => {
        const matchesSearch =
          searchQuery === '' ||
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesPortal =
          selectedPortal === 'all' || job.source.toLowerCase() === selectedPortal.toLowerCase();

        const matchesMode =
          selectedWorkMode === 'all' ||
          job.workMode.toLowerCase().replace(/[\s-]/g, '') === selectedWorkMode.toLowerCase().replace(/[\s-]/g, '');

        const matchesLevel =
          selectedLevel === 'all' || job.level.toLowerCase().includes(selectedLevel.toLowerCase());

        return matchesSearch && matchesPortal && matchesMode && matchesLevel;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'salary') return b.salaryRange.localeCompare(a.salaryRange);
        return 0;
      });
  }, [enrichedJobs, searchQuery, selectedPortal, selectedWorkMode, selectedLevel, sortBy]);

  const toggleSelectBatch = (jobId: string) => {
    const next = new Set(selectedForBatch);
    if (next.has(jobId)) {
      next.delete(jobId);
    } else {
      next.add(jobId);
    }
    setSelectedForBatch(next);
  };

  const handleSelectAllHighMatch = () => {
    const highMatchIds = filteredJobs
      .filter((j) => j.matchScore >= 80 && !appliedJobIds.has(j.id))
      .map((j) => j.id);
    setSelectedForBatch(new Set(highMatchIds));
  };

  const handleAddSelectedToQueue = () => {
    const targetJobs = filteredJobs.filter((j) => selectedForBatch.has(j.id));
    onAddMultipleToQueue(targetJobs);
    setSelectedForBatch(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Hero Strip / Strategy Banner - Clean Black & White */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white">Pencocokan Otomatis Aktif</span>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-300">
                Profil: <strong className="text-white font-medium">{candidate.fullName}</strong> ({candidate.primaryRole})
              </span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('profile')}
                  className="text-zinc-400 hover:text-white underline text-[11px] ml-1"
                >
                  Ubah di Profile
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
              Jobs dan kecocokan CV
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              My Otomate memindai lowongan kerja aktif, menghitung kecocokan ATS secara instan berdasarkan profil Anda, dan menyiapkan lamaran siap kirim.
            </p>

            {/* Live Sync Status Pill Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-zinc-400 text-[11px]">Terhubung:</span>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono">
                {candidate.skills.length} Keahlian Profil
              </span>
              {onNavigateToTab ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('queue')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1"
                  >
                    <span>{queueJobIds.size} di Antrean</span>
                    <span className="text-zinc-500">&rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('tracker')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1"
                  >
                    <span>{appliedJobIds.size} Terkirim di Lacak</span>
                    <span className="text-zinc-500">&rarr;</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono">
                    {queueJobIds.size} di Antrean
                  </span>
                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono">
                    {appliedJobIds.size} Terkirim
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sync Portals CTA */}
            <button
              onClick={onOpenPortalSyncModal}
              className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>Sinkronisasi Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </button>

            <button
              onClick={handleSelectAllHighMatch}
              className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Pilih Match &ge; 80%
            </button>

            <button
              onClick={onOpenCustomJobModal}
              className="px-3.5 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Manual</span>
            </button>
          </div>
        </div>

        {/* Batch selection floating bar */}
        {selectedForBatch.size > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-xl">
            <div className="text-xs text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="font-semibold text-white">{selectedForBatch.size} lowongan terpilih</span>
              <span className="text-zinc-400">siap dimasukkan ke antrean</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedForBatch(new Set())}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddSelectedToQueue}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md shadow-sm transition-all"
              >
                Kirim {selectedForBatch.size} Lowongan ke Antrean
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar - Black and White */}
      <div className="space-y-3 bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari posisi, perusahaan (Gojek, BCA, Shopee, Kredivo), atau skill (React, Python)..."
              className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Work Mode segmented */}
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setSelectedWorkMode('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedWorkMode === 'all'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua Mode
              </button>
              <button
                onClick={() => setSelectedWorkMode('remote')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedWorkMode === 'remote'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Remote
              </button>
              <button
                onClick={() => setSelectedWorkMode('hybrid')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedWorkMode === 'hybrid'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => setSelectedWorkMode('onsite')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedWorkMode === 'onsite'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                On Site
              </button>
            </div>

            {/* Level dropdown */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-black border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">Semua Level</option>
              <option value="junior">Junior / Fresh Grad</option>
              <option value="mid-level">Mid-Level</option>
              <option value="senior">Senior / Lead</option>
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-black border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            >
              <option value="match">Kecocokan CV</option>
              <option value="salary">Estimasi Gaji</option>
              <option value="newest">Lowongan Terbaru</option>
            </select>
          </div>
        </div>

        {/* Portal Filter Badges Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-xs">
          <span className="text-zinc-500 mr-1">Sumber:</span>
          <button
            onClick={() => setSelectedPortal('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedPortal === 'all'
                ? 'bg-white text-black font-semibold'
                : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Semua ({enrichedJobs.length})
          </button>
          <button
            onClick={() => setSelectedPortal('glints')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedPortal === 'glints'
                ? 'bg-white text-black font-semibold'
                : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Glints ({enrichedJobs.filter((j) => j.source === 'Glints').length})
          </button>
          <button
            onClick={() => setSelectedPortal('jobstreet')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedPortal === 'jobstreet'
                ? 'bg-white text-black font-semibold'
                : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            JobStreet ({enrichedJobs.filter((j) => j.source === 'JobStreet').length})
          </button>
          <button
            onClick={() => setSelectedPortal('linkedin')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedPortal === 'linkedin'
                ? 'bg-white text-black font-semibold'
                : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            LinkedIn ({enrichedJobs.filter((j) => j.source === 'LinkedIn').length})
          </button>
          <button
            onClick={() => setSelectedPortal('kalibrr')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedPortal === 'kalibrr'
                ? 'bg-white text-black font-semibold'
                : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Kalibrr ({enrichedJobs.filter((j) => j.source === 'Kalibrr').length})
          </button>
        </div>
      </div>

      {/* Lowongan Cards List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <Briefcase className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">Tidak ada lowongan yang sesuai kriteria</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Coba kurangi filter pencarian atau tarik lowongan terbaru melalui menu Sinkronisasi Portal.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenPortalSyncModal}
                className="text-xs text-white hover:underline font-medium flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Buka Integrasi Portal</span>
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPortal('all');
                  setSelectedWorkMode('all');
                  setSelectedLevel('all');
                }}
                className="text-xs text-zinc-400 hover:text-white font-medium"
              >
                Reset Filter
              </button>
            </div>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isInQueue = queueJobIds.has(job.id);
            const isApplied = appliedJobIds.has(job.id);
            const isSelected = selectedForBatch.has(job.id);

            return (
              <div
                key={job.id}
                className={`group relative bg-zinc-950 border transition-all rounded-xl p-4 sm:p-5 hover:border-zinc-700 ${
                  isSelected
                    ? 'border-white bg-zinc-900/40'
                    : isApplied
                    ? 'border-zinc-800 opacity-75'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Checkbox + Avatar + Title & Meta */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Batch Checkbox */}
                    <button
                      type="button"
                      disabled={isApplied}
                      onClick={() => toggleSelectBatch(job.id)}
                      className={`mt-1 text-zinc-500 hover:text-white transition-colors shrink-0 ${
                        isApplied ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={isApplied ? 'Sudah dilamar' : 'Pilih untuk batch auto-apply'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>

                    {/* Company Initial Monogram - Monochrome */}
                    <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                      {job.companyInitial || job.company.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Job Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onSelectJob(job)}
                          className="text-base font-semibold text-white hover:text-zinc-300 cursor-pointer transition-colors leading-snug truncate"
                        >
                          {job.title}
                        </h3>

                        {/* Portal source tag - Monochrome */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-zinc-900 text-zinc-300 border-zinc-700">
                          {job.source}
                          {job.portalRefId && ` · ${job.portalRefId}`}
                        </span>

                        {isApplied && (
                          <span className="text-xs text-white font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Terkirim
                          </span>
                        )}
                        {isInQueue && !isApplied && (
                          <span className="text-xs text-zinc-400 font-medium">
                            Di Antrean
                          </span>
                        )}
                      </div>

                      {/* Clean Unboxed Metadata without pills (§1.A) */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
                        <span className="font-medium text-zinc-200">{job.company}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.workMode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-200 font-medium">{job.salaryRange}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-500">{job.postedDate}</span>
                      </div>

                      {/* Description excerpt */}
                      <p className="text-xs text-zinc-400 line-clamp-2 pt-0.5 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills match snippet */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        {job.skills.slice(0, 5).map((skill, idx) => {
                          const isMatch = candidate.skills.some(
                            (cs) => cs.toLowerCase() === skill.toLowerCase()
                          );
                          return (
                            <span
                              key={idx}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                isMatch
                                  ? 'bg-zinc-800 text-white border-zinc-600'
                                  : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                              }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                        {job.skills.length > 5 && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            +{job.skills.length - 5} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: ATS Match Gauge + Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline sm:justify-end gap-1.5">
                        <span className="text-xs text-zinc-400">Kecocokan CV:</span>
                        <span className="text-base font-bold font-mono text-white tabular-nums">
                          {job.matchScore}%
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        {job.matchedSkills.length} dari {job.skills.length} kualifikasi
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.applyUrl && (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                          title={`Buka lowongan di ${job.source}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => onSelectJob(job)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {isApplied ? 'Review & Lamar Ulang' : 'Review & Lamar'}
                      </button>

                      {isApplied && onNavigateToTab && (
                        <button
                          onClick={() => onNavigateToTab('tracker')}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Lihat di Lacak
                        </button>
                      )}

                      {isInQueue && !isApplied && onNavigateToTab && (
                        <button
                          onClick={() => onNavigateToTab('queue')}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Lihat di Antrean
                        </button>
                      )}

                      {!isApplied && !isInQueue && (
                        <button
                          onClick={() => onAddJobToQueue(job)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                        >
                          + Antrean
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
