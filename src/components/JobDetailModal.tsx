import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Plus,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Job, CandidateProfile, MatchAnalysisResult } from '../types';
import { calculateJobMatch } from '../utils/atsMatcher';

interface JobDetailModalProps {
  job: Job | null;
  candidate: CandidateProfile;
  isOpen: boolean;
  onClose: () => void;
  onAddToQueue: (job: Job) => void;
  onRemoveFromQueue?: (jobId: string) => void;
  onNavigateToTracker?: () => void;
  onNavigateToQueue?: () => void;
  isInQueue: boolean;
  isApplied: boolean;
  onDirectApply: (job: Job, coverLetter: string, answers: { question: string; answer: string }[]) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  candidate,
  isOpen,
  onClose,
  onAddToQueue,
  onRemoveFromQueue,
  onNavigateToTracker,
  onNavigateToQueue,
  isInQueue,
  isApplied,
  onDirectApply,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'coverLetter' | 'atsMatch' | 'screening'>('overview');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);
  const [letterLanguage, setLetterLanguage] = useState<'id' | 'en'>('id');
  const [letterTone, setLetterTone] = useState<'formal' | 'impactful' | 'creative'>('impactful');
  const [copied, setCopied] = useState<boolean>(false);

  // ATS match state
  const [atsAnalysis, setAtsAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // Screening questions state
  const [screeningAnswers, setScreeningAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState<boolean>(false);

  // Calculate base match score
  const baseMatch = job ? calculateJobMatch(candidate, job) : { score: 75, matchedSkills: [], missingSkills: [] };

  useEffect(() => {
    if (job) {
      setCoverLetter('');
      setAtsAnalysis(null);
      setScreeningAnswers(
        (job.screeningQuestions || []).map((q) => ({ question: q, answer: '' }))
      );
    }
  }, [job]);

  if (!isOpen || !job) return null;

  // Handle Cover Letter Generation with Gemini
  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          job,
          language: letterLanguage,
          tone: letterTone,
        }),
      });
      const data = await res.json();
      if (data.coverLetter) {
        setCoverLetter(data.coverLetter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Handle Deep ATS Analysis with Gemini
  const handleLoadAtsAnalysis = async () => {
    if (atsAnalysis) return;
    setIsLoadingAnalysis(true);
    try {
      const res = await fetch('/api/ai/match-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate, job }),
      });
      const data = await res.json();
      setAtsAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Handle Auto Answer Screening Questions
  const handleAutoAnswer = async () => {
    if (!job.screeningQuestions || job.screeningQuestions.length === 0) return;
    setIsLoadingAnswers(true);
    try {
      const res = await fetch('/api/ai/answer-screening-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          job,
          questions: job.screeningQuestions,
        }),
      });
      const data = await res.json();
      if (data.answers && Array.isArray(data.answers)) {
        setScreeningAnswers(
          job.screeningQuestions.map((q, idx) => ({
            question: q,
            answer: data.answers[idx] || '',
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnswers(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header - Monochrome Black & White */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-4 bg-zinc-950">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-inner">
              {job.companyInitial || job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {job.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-zinc-900 text-zinc-300 border-zinc-700">
                  {job.source}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400 mt-1">
                <span className="font-medium text-zinc-200">{job.company}</span>
                <span aria-hidden="true">·</span>
                <span>{job.location}</span>
                <span aria-hidden="true">·</span>
                <span className="text-white font-mono font-medium">{job.salaryRange}</span>
              </div>

              {/* Applicant Sync Pill */}
              <div className="flex flex-wrap items-center gap-2 text-xs mt-2 pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-500 text-[11px]">Pelamar:</span>
                <span className="text-white font-medium text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  {candidate.fullName} · {candidate.primaryRole}
                </span>
                <span className="font-mono text-zinc-300 text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  ATS: {baseMatch.score}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - B&W */}
        <div className="flex items-center gap-1 px-5 border-b border-zinc-800 bg-black text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Ringkasan Lowongan
          </button>

          <button
            onClick={() => {
              setActiveTab('coverLetter');
              if (!coverLetter) handleGenerateCoverLetter();
            }}
            className={`py-3 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'coverLetter'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Surat Lamaran AI</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('atsMatch');
              handleLoadAtsAnalysis();
            }}
            className={`py-3 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'atsMatch'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>Analisis ATS</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 bg-zinc-800 text-white border border-zinc-700 rounded">
              {baseMatch.score}%
            </span>
          </button>

          {job.screeningQuestions && job.screeningQuestions.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('screening');
                if (screeningAnswers.every((a) => !a.answer)) handleAutoAnswer();
              }}
              className={`py-3 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'screening'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Pertanyaan HR ({job.screeningQuestions.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-zinc-300 text-sm space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Meta strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black p-3.5 rounded-lg border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block">Departemen</span>
                  <span className="text-zinc-200 font-medium">{job.department}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Mode Kerja</span>
                  <span className="text-zinc-200 font-medium">{job.workMode}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Tingkat Pengalaman</span>
                  <span className="text-zinc-200 font-medium">{job.level}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Email HR Target</span>
                  <span className="text-zinc-300 font-mono text-[11px] truncate block">{job.hrEmail}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Deskripsi Pekerjaan
                </h4>
                <p className="text-zinc-300 leading-relaxed bg-black p-3.5 rounded-lg border border-zinc-800">
                  {job.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Kualifikasi & Persyaratan
                </h4>
                <ul className="space-y-2">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills required */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Keahlian yang Dibutuhkan
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s, idx) => {
                    const isCandidateHas = candidate.skills.some(
                      (cs) => cs.toLowerCase() === s.toLowerCase()
                    );
                    return (
                      <span
                        key={idx}
                        className={`text-xs px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 ${
                          isCandidateHas
                            ? 'bg-zinc-800 text-white border border-zinc-600 font-medium'
                            : 'bg-black text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {isCandidateHas && <Check className="w-3 h-3 text-white" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coverLetter' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-black p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Bahasa:</span>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
                    <button
                      onClick={() => setLetterLanguage('id')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        letterLanguage === 'id' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Indonesia
                    </button>
                    <button
                      onClick={() => setLetterLanguage('en')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        letterLanguage === 'en' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                  </div>

                  <span className="text-zinc-400 ml-2">Gaya:</span>
                  <select
                    value={letterTone}
                    onChange={(e: any) => setLetterTone(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-500"
                  >
                    <option value="impactful">Berdampak (Fokus Prestasi)</option>
                    <option value="formal">Formal Korporat</option>
                    <option value="creative">Modern & Fleksibel</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{isGeneratingCoverLetter ? 'Menyusun Surat...' : 'Generate Ulang AI'}</span>
                  </button>

                  {coverLetter && (
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Letter Text Area */}
              {isGeneratingCoverLetter ? (
                <div className="p-8 text-center bg-black rounded-lg border border-zinc-800 space-y-3">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-zinc-200 font-medium">
                    Gemini 3.8 Flash sedang menganalisis lowongan dan menyusun surat lamaran personal...
                  </p>
                  <p className="text-xs text-zinc-500">
                    Menghubungkan keahlian Anda dengan target pencapaian tim {job.company}
                  </p>
                </div>
              ) : (
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Klik 'Generate Ulang AI' atau ketik surat lamaran Anda di sini..."
                  rows={13}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-4 font-sans text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed resize-none font-normal"
                />
              )}

              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                Surat ini akan otomatis dipersonalisasi dan dikirim ke HR saat otomasi dijalankan.
              </p>
            </div>
          )}

          {activeTab === 'atsMatch' && (
            <div className="space-y-4">
              {/* Score header */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">Skor Keselarasan CV (ATS Match)</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-white">
                      {atsAnalysis?.matchScore || baseMatch.score}%
                    </span>
                    <span className="text-xs text-zinc-400">
                      {(atsAnalysis?.matchScore || baseMatch.score) >= 85
                        ? 'Sangat Tinggi (Prioritas Rekomendasi)'
                        : 'Kualifikasi Baik'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500">Keahlian Cocok:</span>
                  <span className="text-xs font-mono font-medium text-white block">
                    {baseMatch.matchedSkills.length} dari {job.skills.length} skills
                  </span>
                </div>
              </div>

              {isLoadingAnalysis ? (
                <div className="p-6 text-center bg-black rounded-lg border border-zinc-800 space-y-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-zinc-400">Menghubungkan ke Gemini untuk evaluasi mendalam...</p>
                </div>
              ) : atsAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Kekuatan Utama CV Anda
                    </h5>
                    <ul className="space-y-1.5 text-xs bg-black p-3 rounded-lg border border-zinc-800">
                      {atsAnalysis.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-zinc-200">
                          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Kata Kunci ATS yang Dianjurkan
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {atsAnalysis.recommendedKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-zinc-200 border border-zinc-700 font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Saran Optimalisasi Wawancara
                    </h5>
                    <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded border border-zinc-800 leading-relaxed">
                      {atsAnalysis.atsAdvice}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-400">
                    Keahlian Anda yang langsung selaras dengan posisi ini:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {baseMatch.matchedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-zinc-200 border border-zinc-700 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'screening' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black p-3 rounded-lg border border-zinc-800 text-xs">
                <span className="text-zinc-400">
                  Pertanyaan ini sering diajukan HR pada seleksi awal:
                </span>
                <button
                  onClick={handleAutoAnswer}
                  disabled={isLoadingAnswers}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingAnswers ? 'Menjawab...' : 'Jawab Otomatis AI'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {screeningAnswers.map((item, idx) => (
                  <div key={idx} className="bg-black p-3.5 rounded-lg border border-zinc-800 space-y-2">
                    <p className="text-xs font-medium text-zinc-200 flex items-start gap-2">
                      <span className="font-mono text-white">{idx + 1}.</span>
                      <span>{item.question}</span>
                    </p>
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newAns = [...screeningAnswers];
                        newAns[idx].answer = e.target.value;
                        setScreeningAnswers(newAns);
                      }}
                      placeholder="Jawaban otomatis akan muncul di sini atau ketik langsung..."
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none font-normal"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {isApplied ? (
              <span className="text-white flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4 text-white" /> Lamaran sudah terkirim ke lowongan ini
              </span>
            ) : isInQueue ? (
              <span className="text-zinc-300 flex items-center gap-1 font-medium">
                <Clock className="w-4 h-4 text-zinc-400" /> Berada di antrean
              </span>
            ) : (
              <span>Siap untuk diproses secara otomatis</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {job.applyUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                title={`Kunjungi halaman lowongan di ${job.source}`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Buka di {job.source}</span>
              </a>
            )}

            {isApplied && onNavigateToTracker && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTracker();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
              >
                <span>Lihat di Lacak</span>
              </button>
            )}

            {isInQueue && (
              <>
                {onNavigateToQueue && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToQueue();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                  >
                    <span>Buka Antrean</span>
                  </button>
                )}
                {onRemoveFromQueue && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveFromQueue(job.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
                  >
                    <span>Keluarkan dari Antrean</span>
                  </button>
                )}
              </>
            )}

            {!isInQueue && !isApplied && (
              <button
                type="button"
                onClick={() => {
                  onAddToQueue(job);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ke Antrean</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const finalLetter = coverLetter || `Yth. Tim Rekrutmen ${job.company},\n\nSaya bermaksud melamar untuk posisi ${job.title}.\n\nHormat saya,\n${candidate.fullName}`;
                onDirectApply(job, finalLetter, screeningAnswers);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{isApplied ? 'Kirim Ulang Lamaran' : 'Lamar Sekarang (1-Klik)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
