/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { JobRadar } from './components/JobRadar';
import { AutoApplyQueue } from './components/AutoApplyQueue';
import { ApplicationTracker } from './components/ApplicationTracker';
import { ProfileVault } from './components/ProfileVault';
import { JobDetailModal } from './components/JobDetailModal';
import { CustomJobModal } from './components/CustomJobModal';
import { INITIAL_JOBS } from './data/seedJobs';
import { DEFAULT_CANDIDATES } from './data/defaultCandidates';
import { INITIAL_PORTALS } from './data/portalIntegrations';
import { PortalSyncModal } from './components/PortalSyncModal';
import {
  Job,
  CandidateProfile,
  QueueItem,
  ApplicationRecord,
  AutoApplyConfig,
  ApplicationStatus,
} from './types';
import { calculateJobMatch } from './utils/atsMatcher';

export default function App() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'queue' | 'tracker' | 'profile'>('jobs');

  // Candidate Profile State with localStorage persistence
  const [candidate, setCandidate] = useState<CandidateProfile>(() => {
    try {
      const saved = localStorage.getItem('autolamar_candidate');
      return saved ? JSON.parse(saved) : DEFAULT_CANDIDATES[0];
    } catch {
      return DEFAULT_CANDIDATES[0];
    }
  });

  // Jobs state
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('autolamar_jobs');
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('autolamar_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Applications Tracker state
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('autolamar_applications');
      if (saved) return JSON.parse(saved);
      // Default 1 realistic seed application
      return [
        {
          id: 'app-init-1',
          trackingId: 'APP-GOTO-9921',
          jobId: 'job-1',
          jobTitle: 'Senior Frontend Engineer (React & TypeScript)',
          company: 'GoTo Financial',
          location: 'Jakarta Selatan (Hybrid)',
          hrEmail: 'talent-acquisition@gotofinancial.com',
          appliedAt: 'Kemarin, 14:20',
          status: 'Ditinjau HR',
          matchScore: 94,
          coverLetter: 'Yth. Tim Rekrutmen & HRD GoTo Financial,\n\nDengan hormat, sehubungan dengan informasi lowongan posisi Senior Frontend Engineer...',
          screeningAnswers: [
            {
              question: 'Berapa lama pengalaman Anda menggunakan TypeScript dalam skala aplikasi produksi?',
              answer: '4+ tahun secara intensif di environment e-commerce ber-traffic tinggi.',
            },
          ],
          deliveryMethod: 'direct_email',
        },
      ];
    } catch {
      return [];
    }
  });

  // Automation Settings
  const [config, setConfig] = useState<AutoApplyConfig>({
    delaySeconds: 2,
    language: 'id',
    tone: 'impactful',
    autoAnswerQuestions: true,
    attachPortfolio: true,
    autoEmailDispatch: true,
  });

  // Modals & Active Selections
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isCustomJobModalOpen, setIsCustomJobModalOpen] = useState(false);
  const [isPortalSyncModalOpen, setIsPortalSyncModalOpen] = useState(false);
  const [isSyncingPortals, setIsSyncingPortals] = useState(false);
  const [portals, setPortals] = useState(INITIAL_PORTALS);

  // Queue Processing Execution Engine
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [activeProcessingId, setActiveProcessingId] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('autolamar_candidate', JSON.stringify(candidate));
  }, [candidate]);

  useEffect(() => {
    localStorage.setItem('autolamar_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('autolamar_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('autolamar_applications', JSON.stringify(applications));
  }, [applications]);

  // Sets for quick lookup
  const queueJobIds = new Set(queue.map((q) => q.job.id));
  const appliedJobIds = new Set(applications.map((a) => a.jobId));

  // Add single job to queue
  const handleAddJobToQueue = (job: Job) => {
    if (queueJobIds.has(job.id)) {
      showToast(`Lowongan "${job.title}" sudah ada di antrean.`);
      return;
    }
    const newItem: QueueItem = {
      id: 'queue-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      job,
      addedAt: new Date().toLocaleTimeString('id-ID'),
      status: 'pending',
    };
    setQueue((prev) => [...prev, newItem]);
    showToast(`"${job.title}" ditambahkan ke antrean.`);
  };

  // Add multiple jobs to queue
  const handleAddMultipleToQueue = (selectedJobs: Job[]) => {
    const unqueued = selectedJobs.filter((j) => !queueJobIds.has(j.id) && !appliedJobIds.has(j.id));
    if (unqueued.length === 0) return;

    const newItems: QueueItem[] = unqueued.map((job) => ({
      id: 'queue-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      job,
      addedAt: new Date().toLocaleTimeString('id-ID'),
      status: 'pending',
    }));

    setQueue((prev) => [...prev, ...newItems]);
    showToast(`${newItems.length} lowongan dimasukkan ke antrean auto-apply.`);
    setActiveTab('queue');
  };

  // Remove item from queue
  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear entire queue
  const handleClearQueue = () => {
    setQueue([]);
    showToast('Antrean berhasil dikosongkan.');
  };

  // Direct Apply (1-Click)
  const handleDirectApply = async (
    job: Job,
    coverLetter: string,
    screeningAnswers: { question: string; answer: string }[]
  ) => {
    const trackingId = 'APP-' + Date.now().toString(36).toUpperCase();
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const match = calculateJobMatch(candidate, job);

    const newApp: ApplicationRecord = {
      id: 'app-' + Date.now().toString(36),
      trackingId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      hrEmail: job.hrEmail,
      appliedAt: dateFormatted,
      status: 'Terkirim',
      matchScore: match.score,
      coverLetter,
      screeningAnswers,
      deliveryMethod: 'direct_email',
    };

    setApplications((prev) => [newApp, ...prev]);
    // Remove from queue if was in queue
    setQueue((prev) => prev.filter((q) => q.job.id !== job.id));

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 },
    });

    showToast(`Lamaran ke ${job.company} sukses dikirim! (No. Resi: ${trackingId})`);
  };

  // Update application status
  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`Status lamaran diperbarui ke: ${newStatus}`);
  };

  // Delete application record
  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    showToast('Riwayat lamaran dihapus.');
  };

  // Add custom job
  const handleAddCustomJob = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    handleAddJobToQueue(newJob);
    showToast(`Lowongan kustom "${newJob.title}" berhasil ditambahkan.`);
  };

  // Trigger Live Portal Sync (Glints, JobStreet, etc.)
  const handleTriggerPortalSync = async (selectedPortalNames: string[]) => {
    setIsSyncingPortals(true);
    try {
      const res = await fetch('/api/portals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portals: selectedPortalNames }),
      });
      const data = await res.json();
      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      setPortals((prev) =>
        prev.map((p) =>
          selectedPortalNames.includes(p.sourceType)
            ? { ...p, lastSync: `${timeNow} (Baru saja disinkronkan)`, syncStatus: 'active' }
            : p
        )
      );

      showToast(data.message || `Feed lowongan dari ${selectedPortalNames.join(', ')} berhasil diperbarui!`);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menyinkronkan data portal lowongan.');
    } finally {
      setIsSyncingPortals(false);
    }
  };

  // Handle imported job from Glints/JobStreet URL
  const handleImportExtractedJob = (extractedJob: Job) => {
    setJobs((prev) => [extractedJob, ...prev]);
    handleAddJobToQueue(extractedJob);
    showToast(`Lowongan "${extractedJob.title}" dari ${extractedJob.source} berhasil diimpor & masuk ke antrean!`);
    setActiveTab('jobs');
  };

  // Automation Engine Execution Loop
  const handleStartQueue = async () => {
    const pendingItems = queue.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('Tidak ada lowongan berstatus pending di antrean.');
      return;
    }

    setIsProcessingQueue(true);
    stopRequestedRef.current = false;

    for (const item of pendingItems) {
      if (stopRequestedRef.current) break;

      setActiveProcessingId(item.id);

      // Step 1: Matching & ATS preparation
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'processing', progressStep: 'Menganalisis kualifikasi lowongan & skor ATS...' }
            : q
        )
      );
      await new Promise((r) => setTimeout(r, 600));
      if (stopRequestedRef.current) break;

      // Step 2: Tailoring Cover Letter with Gemini AI
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, progressStep: 'Menyusun surat lamaran kustom dengan Gemini 3.8 Flash...' }
            : q
        )
      );

      let generatedCoverLetter = '';
      try {
        const letterRes = await fetch('/api/ai/generate-cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate,
            job: item.job,
            language: config.language,
            tone: config.tone,
          }),
        });
        const letterData = await letterRes.json();
        generatedCoverLetter = letterData.coverLetter || '';
      } catch (err) {
        console.error(err);
      }
      if (stopRequestedRef.current) break;

      // Step 3: Answering Screening Questions if needed
      let screeningAnswers: { question: string; answer: string }[] = [];
      if (config.autoAnswerQuestions && item.job.screeningQuestions && item.job.screeningQuestions.length > 0) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, progressStep: 'Menjawab pertanyaan skrining HR otomatis...' }
              : q
          )
        );
        try {
          const ansRes = await fetch('/api/ai/answer-screening-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate,
              job: item.job,
              questions: item.job.screeningQuestions,
            }),
          });
          const ansData = await ansRes.json();
          if (ansData.answers && Array.isArray(ansData.answers)) {
            screeningAnswers = item.job.screeningQuestions.map((q, idx) => ({
              question: q,
              answer: ansData.answers[idx] || 'Siap berkontribusi maksimal sesuai kualifikasi.',
            }));
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (stopRequestedRef.current) break;

      // Step 4: Dispatch to HR API / Record
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, progressStep: 'Mengirimkan berkas lamaran ke email HR...' }
            : q
        )
      );

      let trackingId = 'APP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
      try {
        const dispatchRes = await fetch('/api/apply/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate,
            job: item.job,
            coverLetter: generatedCoverLetter,
            answers: screeningAnswers,
            deliveryMethod: 'direct_email',
          }),
        });
        const dispatchData = await dispatchRes.json();
        if (dispatchData.trackingId) {
          trackingId = dispatchData.trackingId;
        }
      } catch (err) {
        console.error(err);
      }

      // Mark completed in queue
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'completed',
                progressStep: 'Terkirim Sukses',
                trackingId,
                generatedCoverLetter,
              }
            : q
        )
      );

      // Create new application record
      const match = calculateJobMatch(candidate, item.job);
      const dateFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newRecord: ApplicationRecord = {
        id: 'app-' + Date.now().toString(36),
        trackingId,
        jobId: item.job.id,
        jobTitle: item.job.title,
        company: item.job.company,
        location: item.job.location,
        hrEmail: item.job.hrEmail,
        appliedAt: dateFormatted,
        status: 'Terkirim',
        matchScore: match.score,
        coverLetter: generatedCoverLetter,
        screeningAnswers,
        deliveryMethod: 'direct_email',
      };

      setApplications((prev) => [newRecord, ...prev]);

      // Throttle delay between items
      if (config.delaySeconds > 0) {
        await new Promise((r) => setTimeout(r, config.delaySeconds * 1000));
      }
    }

    setIsProcessingQueue(false);
    setActiveProcessingId(null);

    // If batch finished without being paused, celebrate with confetti!
    if (!stopRequestedRef.current) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      showToast('Otomasi selesai! Seluruh lamaran di antrean berhasil dikirimkan.');
    }
  };

  const handlePauseQueue = () => {
    stopRequestedRef.current = true;
    setIsProcessingQueue(false);
    setActiveProcessingId(null);
    showToast('Proses antrean dijeda.');
  };

  const pendingQueueCount = queue.filter((item) => item.status === 'pending').length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      {/* Navbar with 3-zone contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={pendingQueueCount}
        appliedCount={applications.length}
        onStartAutoApply={() => {
          setActiveTab('queue');
          if (!isProcessingQueue && pendingQueueCount > 0) {
            handleStartQueue();
          }
        }}
        isProcessingQueue={isProcessingQueue}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'jobs' && (
          <JobRadar
            jobs={jobs}
            candidate={candidate}
            queueJobIds={queueJobIds}
            appliedJobIds={appliedJobIds}
            onSelectJob={(job) => setSelectedJobForModal(job)}
            onAddJobToQueue={handleAddJobToQueue}
            onAddMultipleToQueue={handleAddMultipleToQueue}
            onOpenCustomJobModal={() => setIsCustomJobModalOpen(true)}
            onOpenPortalSyncModal={() => setIsPortalSyncModalOpen(true)}
          />
        )}

        {activeTab === 'queue' && (
          <AutoApplyQueue
            queue={queue}
            candidate={candidate}
            isProcessing={isProcessingQueue}
            activeProcessingId={activeProcessingId}
            onStartQueue={handleStartQueue}
            onPauseQueue={handlePauseQueue}
            onClearQueue={handleClearQueue}
            onRemoveItem={handleRemoveQueueItem}
            config={config}
            setConfig={setConfig}
            onGoToTracker={() => setActiveTab('tracker')}
          />
        )}

        {activeTab === 'tracker' && (
          <ApplicationTracker
            applications={applications}
            candidate={candidate}
            onUpdateStatus={handleUpdateStatus}
            onDeleteRecord={handleDeleteApplication}
            onGoToRadar={() => setActiveTab('jobs')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileVault
            candidate={candidate}
            setCandidate={setCandidate}
            onSaveNotification={() => showToast('Profil berhasil disimpan & disinkronkan!')}
          />
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJobForModal && (
        <JobDetailModal
          job={selectedJobForModal}
          candidate={candidate}
          isOpen={true}
          onClose={() => setSelectedJobForModal(null)}
          onAddToQueue={handleAddJobToQueue}
          isInQueue={queueJobIds.has(selectedJobForModal.id)}
          isApplied={appliedJobIds.has(selectedJobForModal.id)}
          onDirectApply={handleDirectApply}
        />
      )}

      {/* Custom Job Add Modal */}
      <CustomJobModal
        isOpen={isCustomJobModalOpen}
        onClose={() => setIsCustomJobModalOpen(false)}
        onAddJob={handleAddCustomJob}
      />

      {/* Portal Sync & URL Import Modal */}
      <PortalSyncModal
        isOpen={isPortalSyncModalOpen}
        onClose={() => setIsPortalSyncModalOpen(false)}
        portals={portals}
        onTriggerSync={handleTriggerPortalSync}
        onImportExtractedJob={handleImportExtractedJob}
        isSyncing={isSyncingPortals}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Minimal Clean Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 bg-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>My Otomate · Platform Otomasi Lamaran Kerja</span>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>ATS Compliance Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
