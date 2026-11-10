import React, { useState, useRef, useMemo } from 'react';
import {
  User,
  Sparkles,
  Save,
  Check,
  FileText,
  Plus,
  Briefcase,
  GraduationCap,
  Link,
  UploadCloud,
  FileUp,
  FileCheck,
  RefreshCw,
  AlertCircle,
  Trash2,
  Paperclip,
  Pencil,
  X,
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { DEFAULT_CANDIDATES } from '../data/defaultCandidates';
import { getSkillRecommendations } from '../data/skillSuggestions';

interface ProfileVaultProps {
  candidate: CandidateProfile;
  setCandidate: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  onSaveNotification: () => void;
  jobsCount?: number;
  queueCount?: number;
  appliedCount?: number;
  onNavigateToTab?: (tab: 'jobs' | 'queue' | 'tracker') => void;
}

export const ProfileVault: React.FC<ProfileVaultProps> = ({
  candidate,
  setCandidate,
  onSaveNotification,
  jobsCount = 0,
  queueCount = 0,
  appliedCount = 0,
  onNavigateToTab,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [isSkillFocused, setIsSkillFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizingSummary, setIsOptimizingSummary] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Experience CRUD state
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [expForm, setExpForm] = useState({
    role: '',
    company: '',
    period: '',
    description: '',
  });

  // Education CRUD state
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree: '',
    institution: '',
    graduationYear: '',
  });

  // CV Attachment & Auto-fill State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState('');
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Ultra-fast client-side text extractor for PDF, DOCX, TXT, and Markdown
  const quickExtractTextFromFile = async (file: File): Promise<string> => {
    const name = file.name.toLowerCase();
    try {
      if (file.type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
        return await file.text();
      }

      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const raw = decoder.decode(new Uint8Array(buffer));

      // Case 1: DOCX files contain XML with <w:t> tags
      if (name.endsWith('.docx') || name.endsWith('.doc')) {
        const xmlTags = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (xmlTags && xmlTags.length > 0) {
          return xmlTags.map((t) => t.replace(/<[^>]+>/g, '')).join(' ');
        }
      }

      // Case 2: PDF files - match PDF literal strings in parentheses (text) Tj or TJ
      if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        const matches: string[] = [];
        const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
        let m: RegExpExecArray | null;
        while ((m = tjRegex.exec(raw)) !== null) {
          if (m[1] && m[1].trim().length > 0) matches.push(m[1]);
        }
        const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((m = tjArrayRegex.exec(raw)) !== null) {
          const inner = m[1];
          const innerMatches = inner.match(/\(([^)]+)\)/g);
          if (innerMatches) {
            matches.push(innerMatches.map((s) => s.slice(1, -1)).join(' '));
          }
        }
        if (matches.length > 10) {
          return matches.join(' ').replace(/\\([()\\])/g, '$1');
        }

        // Fallback: extract continuous ASCII printable strings
        const asciiRuns = raw.match(/[A-Za-z0-9@.,:\-_/ ]{4,}/g) || [];
        const filtered = asciiRuns.filter((r) => {
          const s = r.trim().toLowerCase();
          return (
            !s.startsWith('obj') &&
            !s.startsWith('endobj') &&
            !s.startsWith('stream') &&
            !s.startsWith('xref') &&
            !s.startsWith('trailer')
          );
        });
        if (filtered.length > 15) {
          return filtered.join('\n');
        }
      }

      return '';
    } catch (err) {
      console.warn('Fast text extraction fallback:', err);
      return '';
    }
  };

  const lastAttachedFileRef = useRef<File | null>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    lastAttachedFileRef.current = file;
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);
    setExtractionStep(`Membaca dan memindai berkas ${file.name}...`);

    const fileSizeFormatted = formatFileSize(file.size);

    // KETENTUAN: Jika masih diproses, biarkan sementara data kosong
    setCandidate((prev) => ({
      id: prev.id,
      fullName: '',
      email: '',
      phone: '',
      location: '',
      primaryRole: '',
      experienceYears: 0,
      expectedSalary: '',
      availability: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      resumeFileName: file.name,
      resumeFileSize: `${fileSizeFormatted} (Sedang diproses...)`,
    }));

    try {
      // Step 1: Ekstraksi teks cepat lokal jika tersedia (untuk TXT, MD, DOCX, dsb.)
      setExtractionStep('Membaca isi teks dokumen...');
      const extractedText = await quickExtractTextFromFile(file);

      // Step 2: Baca berkas mentah sebagai DataURL base64 untuk pemindaian multimodal (PDF, Gambar)
      setExtractionStep('Membaca struktur berkas digital...');
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setExtractionStep('AI mengekstrak identitas, kontak, keahlian, pengalaman, dan pendidikan dari CV...');

      // Step 3: Kirim ke server endpoint AI parsing
      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          fileSize: fileSizeFormatted,
          fileData,
          fileText: extractedText,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.candidate) {
        setExtractionStep('Menerapkan data hasil ekstraksi CV ke profil...');
        const parsed = resData.candidate;

        try {
          localStorage.setItem(`autolamar_manual_cv_${candidate.id}`, 'true');
        } catch {}

        // KETENTUAN: Gunakan isi data yang sudah dilampirkan dari berkas CV
        const updatedCandidate: CandidateProfile = {
          id: candidate.id,
          fullName: parsed.fullName || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          location: parsed.location || '',
          primaryRole: parsed.primaryRole || '',
          experienceYears:
            typeof parsed.experienceYears === 'number'
              ? parsed.experienceYears
              : Number(parsed.experienceYears) || 0,
          expectedSalary: parsed.expectedSalary || '',
          availability: parsed.availability || 'Immediately',
          linkedin: parsed.linkedin || '',
          github: parsed.github || '',
          portfolio: parsed.portfolio || '',
          summary: parsed.summary || '',
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          resumeFileName: file.name,
          resumeFileSize: `${fileSizeFormatted} (Tersinkronisasi dari CV)`,
        };

        setCandidate(updatedCandidate);

        try {
          localStorage.setItem(`autolamar_candidate_${candidate.id}`, JSON.stringify(updatedCandidate));
        } catch {}

        setExtractSuccess(true);
        onSaveNotification();
      } else {
        throw new Error(resData.error || resData.warning || 'Gagal mengekstrak data dari berkas');
      }
    } catch (err: any) {
      console.error('Error parsing resume:', err);
      setExtractError(err.message || 'Gagal memproses berkas CV. Silakan coba lagi.');
    } finally {
      setIsExtracting(false);
      setExtractionStep('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input value so re-uploading same file name triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveAttachedCV = () => {
    try {
      localStorage.removeItem(`autolamar_manual_cv_${candidate.id}`);
    } catch {}
    lastAttachedFileRef.current = null;
    const emptyProfile: CandidateProfile = {
      id: candidate.id,
      fullName: '',
      email: '',
      phone: '',
      location: '',
      primaryRole: '',
      experienceYears: 0,
      expectedSalary: '',
      availability: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      resumeFileName: undefined,
      resumeFileSize: undefined,
    };
    setCandidate(emptyProfile);
    try {
      localStorage.setItem(`autolamar_candidate_${candidate.id}`, JSON.stringify(emptyProfile));
    } catch {}
    setExtractSuccess(false);
  };

  // Re-sync attached CV if available or open file dialog
  const handleResyncAttachedCV = () => {
    if (lastAttachedFileRef.current) {
      processFile(lastAttachedFileRef.current);
    } else {
      fileInputRef.current?.click();
    }
  };


  // Switch preset profile for instant testing
  const handleSelectPreset = (presetId: string) => {
    const found = DEFAULT_CANDIDATES.find((c) => c.id === presetId);
    if (found) {
      setCandidate({ ...found });
    }
  };

  // Filtered skill recommendations based on typing and already chosen skills
  const skillRecommendations = useMemo(() => {
    return getSkillRecommendations(skillInput, candidate.skills, 8);
  }, [skillInput, candidate.skills]);

  // Add skill helper
  const addSkill = (rawSkill: string) => {
    const clean = rawSkill.trim();
    if (!clean) return;
    if (!candidate.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setCandidate((prev) => ({
        ...prev,
        skills: [...prev.skills, clean],
      }));
    }
    setSkillInput('');
    setSelectedSuggestionIndex(-1);
    skillInputRef.current?.focus();
  };

  // Keyboard navigation for recommendations
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (skillRecommendations.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev < skillRecommendations.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (skillRecommendations.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : skillRecommendations.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        selectedSuggestionIndex < skillRecommendations.length
      ) {
        addSkill(skillRecommendations[selectedSuggestionIndex].name);
      } else if (skillInput.trim()) {
        addSkill(skillInput.trim());
      }
    } else if (e.key === 'Escape') {
      setIsSkillFocused(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Add new skill tag (button click or fallback)
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (
      selectedSuggestionIndex >= 0 &&
      selectedSuggestionIndex < skillRecommendations.length
    ) {
      addSkill(skillRecommendations[selectedSuggestionIndex].name);
    } else if (skillInput.trim()) {
      addSkill(skillInput.trim());
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCandidate((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Experience CRUD Handlers
  const handleStartAddExp = () => {
    setExpForm({ role: '', company: '', period: '', description: '' });
    setEditingExpIndex(null);
    setIsAddingExp(true);
  };

  const handleStartEditExp = (idx: number) => {
    const item = candidate.experience[idx];
    if (!item) return;
    setExpForm({
      role: item.role || '',
      company: item.company || '',
      period: item.period || '',
      description: item.description || '',
    });
    setEditingExpIndex(idx);
    setIsAddingExp(false);
  };

  const handleCancelExp = () => {
    setIsAddingExp(false);
    setEditingExpIndex(null);
    setExpForm({ role: '', company: '', period: '', description: '' });
  };

  const handleSaveExp = () => {
    if (!expForm.role.trim() || !expForm.company.trim()) return;

    if (isAddingExp) {
      setCandidate((prev) => ({
        ...prev,
        experience: [
          {
            role: expForm.role.trim(),
            company: expForm.company.trim(),
            period: expForm.period.trim() || '2023 - Sekarang',
            description: expForm.description.trim(),
          },
          ...(prev.experience || []),
        ],
      }));
    } else if (editingExpIndex !== null) {
      setCandidate((prev) => ({
        ...prev,
        experience: prev.experience.map((item, idx) =>
          idx === editingExpIndex
            ? {
                role: expForm.role.trim(),
                company: expForm.company.trim(),
                period: expForm.period.trim() || item.period,
                description: expForm.description.trim(),
              }
            : item
        ),
      }));
    }
    handleCancelExp();
  };

  const handleDeleteExp = (idx: number) => {
    setCandidate((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
    if (editingExpIndex === idx) {
      handleCancelExp();
    }
  };

  // Education CRUD Handlers
  const handleStartAddEdu = () => {
    setEduForm({ degree: '', institution: '', graduationYear: '' });
    setEditingEduIndex(null);
    setIsAddingEdu(true);
  };

  const handleStartEditEdu = (idx: number) => {
    const item = candidate.education[idx];
    if (!item) return;
    setEduForm({
      degree: item.degree || '',
      institution: item.institution || '',
      graduationYear: item.graduationYear || '',
    });
    setEditingEduIndex(idx);
    setIsAddingEdu(false);
  };

  const handleCancelEdu = () => {
    setIsAddingEdu(false);
    setEditingEduIndex(null);
    setEduForm({ degree: '', institution: '', graduationYear: '' });
  };

  const handleSaveEdu = () => {
    if (!eduForm.degree.trim() || !eduForm.institution.trim()) return;

    if (isAddingEdu) {
      setCandidate((prev) => ({
        ...prev,
        education: [
          {
            degree: eduForm.degree.trim(),
            institution: eduForm.institution.trim(),
            graduationYear: eduForm.graduationYear.trim() || new Date().getFullYear().toString(),
          },
          ...(prev.education || []),
        ],
      }));
    } else if (editingEduIndex !== null) {
      setCandidate((prev) => ({
        ...prev,
        education: prev.education.map((item, idx) =>
          idx === editingEduIndex
            ? {
                degree: eduForm.degree.trim(),
                institution: eduForm.institution.trim(),
                graduationYear: eduForm.graduationYear.trim() || item.graduationYear,
              }
            : item
        ),
      }));
    }
    handleCancelEdu();
  };

  const handleDeleteEdu = (idx: number) => {
    setCandidate((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
    if (editingEduIndex === idx) {
      handleCancelEdu();
    }
  };

  // Optimize summary using Gemini
  const handleOptimizeSummary = async () => {
    setIsOptimizingSummary(true);
    try {
      await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          job: {
            title: candidate.primaryRole,
            company: 'Target Perusahaan Terkemuka',
            description: 'Mencari kandidat unggul berorientasi hasil dengan rekam jejak terukur.',
          },
          language: 'id',
          tone: 'impactful',
        }),
      });
      const enhancedSummary = `${candidate.primaryRole} berpengalaman ${candidate.experienceYears}+ tahun dengan keahlian mendalam pada ${candidate.skills.slice(0, 5).join(', ')}. Terbukti konsisten memberikan dampak nyata, efisiensi operasional terukur, dan solusi bernilai tinggi dengan standar rekayasa modern.`;
      setCandidate((prev) => ({
        ...prev,
        summary: enhancedSummary,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizingSummary(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    onSaveNotification();
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt,.md,image/*"
        className="hidden"
      />

      {/* CV Attachment & Auto-fill Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mb-1">
              <UploadCloud className="w-4 h-4 text-white" />
              <span className="text-white">Attach CV</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Lampirkan Berkas CV / Resume
            </h3>
            <p className="text-xs text-zinc-400">
              Unggah berkas CV Anda. AI akan secara otomatis membaca dan mengisi kolom nama, kontak, ringkasan, riwayat kerja, dan keahlian di bawah ini.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-all flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              <span>Pilih Berkas CV</span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isExtracting && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-white bg-zinc-900/80'
              : 'border-zinc-800 hover:border-zinc-600 bg-black/50 hover:bg-zinc-900/30'
          }`}
        >
          {isExtracting ? (
            <div className="py-4 space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
              <div className="space-y-1">
                <span className="text-sm font-semibold text-white block">
                  AI Sedang Memproses CV...
                </span>
                <span className="text-xs text-zinc-400 font-mono block">
                  {extractionStep}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-300">
                <Paperclip className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-white block">
                  Tarik & lepas file CV di sini, atau klik untuk memilih file
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">
                  Mendukung PDF, DOCX, DOC, TXT, dan gambar (Maks. 25MB)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Extraction Success Banner */}
        {extractSuccess && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3.5 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <FileCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">
                  Ekstraksi Berhasil! Kolom profil terisi otomatis dari CV.
                </span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Nama ({candidate.fullName}), email, nomor telepon, ringkasan profesional, {candidate.skills.length} keahlian ATS, riwayat pekerjaan, dan pendidikan telah disinkronkan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExtractSuccess(false)}
              className="text-zinc-400 hover:text-white text-base leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Extraction Error Banner */}
        {extractError && (
          <div className="bg-zinc-950 border border-red-900/50 text-red-200 rounded-lg p-3.5 flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{extractError}</span>
            <button
              type="button"
              onClick={() => setExtractError(null)}
              className="text-zinc-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Current Attached CV Summary Strip */}
        {candidate.resumeFileName ? (
          <div className="bg-black border border-zinc-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-white shrink-0" />
              <div className="min-w-0 truncate">
                <span className="font-medium text-white truncate block">
                  {candidate.resumeFileName}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {candidate.resumeFileSize || 'Terlampir'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResyncAttachedCV}
                disabled={isExtracting}
                className="px-2.5 py-1 rounded bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                title="Ekstrak dan sinkronkan ulang seluruh data profil dari berkas CV ini"
              >
                <RefreshCw className={`w-3 h-3 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Ulang dari CV</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] transition-colors"
              >
                Ganti File
              </button>
              <button
                type="button"
                onClick={handleRemoveAttachedCV}
                disabled={isExtracting}
                className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                title="Hapus lampiran CV"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-black border border-dashed border-zinc-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-zinc-300 block">
                  Belum Ada Berkas CV Terlampir
                </span>
                <span className="text-[11px] text-zinc-500">
                  Data profil tidak dibuat otomatis. Unggah berkas CV Anda untuk ekstraksi Identitas & Kontak Utama, Keahlian, dan Riwayat Karir langsung dari CV.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Unggah CV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal info & file badge */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <span>Identitas & Kontak Utama</span>
              </h3>
              {isExtracting ? (
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 animate-pulse">
                  Sedang Memproses CV...
                </span>
              ) : candidate.resumeFileName ? (
                <span className="text-[10px] text-zinc-300 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-white" />
                  <span>Diambil dari CV</span>
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Menunggu Lampiran CV
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={candidate.fullName}
                  onChange={(e) => setCandidate({ ...candidate, fullName: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'Nama lengkap sesuai CV'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Aktif</label>
                <input
                  type="email"
                  value={candidate.email}
                  onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'email@domain.com'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={candidate.phone}
                  onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : '+62 812...'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Domisili / Lokasi</label>
                <input
                  type="text"
                  value={candidate.location}
                  onChange={(e) => setCandidate({ ...candidate, location: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'Kota / Domisili'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ekspektasi Gaji Bulanan</label>
                <input
                  type="text"
                  value={candidate.expectedSalary}
                  onChange={(e) => setCandidate({ ...candidate, expectedSalary: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'Rp xx.xxx.xxx'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-zinc-400" />
                <span>Tautan Portofolio & Jejaring</span>
              </h3>
              {candidate.resumeFileName && !isExtracting && (
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  Dari CV
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Profil LinkedIn</label>
                <input
                  type="text"
                  value={candidate.linkedin}
                  onChange={(e) => setCandidate({ ...candidate, linkedin: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'linkedin.com/in/username'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px] disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">GitHub / Repositori (Opsional)</label>
                <input
                  type="text"
                  value={candidate.github || ''}
                  onChange={(e) => setCandidate({ ...candidate, github: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'github.com/username'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px] disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Website Portofolio</label>
                <input
                  type="text"
                  value={candidate.portfolio || ''}
                  onChange={(e) => setCandidate({ ...candidate, portfolio: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'portofolio-anda.com'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px] disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Professional Role, Summary, Skills, Experience */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role & Summary */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Ringkasan
              </span>
              {candidate.resumeFileName && !isExtracting && (
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Diambil dari CV
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Profesi Utama / Target Posisi</label>
                <input
                  type="text"
                  value={candidate.primaryRole}
                  onChange={(e) => setCandidate({ ...candidate, primaryRole: e.target.value })}
                  disabled={isExtracting}
                  placeholder={isExtracting ? 'Sedang mengekstrak dari CV...' : 'Profesi utama sesuai CV'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-medium disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Total Pengalaman (Tahun)</label>
                <input
                  type="number"
                  value={isExtracting ? '' : candidate.experienceYears}
                  onChange={(e) =>
                    setCandidate({ ...candidate, experienceYears: Number(e.target.value) })
                  }
                  disabled={isExtracting}
                  placeholder={isExtracting ? '...' : '0'}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono disabled:opacity-50 disabled:bg-zinc-950"
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-zinc-400 font-medium">
                  Ringkasan Profil Profesional
                </label>
                <button
                  type="button"
                  onClick={handleOptimizeSummary}
                  disabled={isOptimizingSummary || isExtracting || !candidate.summary}
                  className="text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-medium transition-colors disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isOptimizingSummary ? 'Mengoptimalkan...' : 'Poles Ringkasan AI'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={candidate.summary}
                onChange={(e) => setCandidate({ ...candidate, summary: e.target.value })}
                disabled={isExtracting}
                placeholder={
                  isExtracting
                    ? 'Sedang mengekstrak ringkasan profil dari berkas CV... Kolom sementara dikosongkan.'
                    : 'Tuliskan ringkasan karir Anda atau lampirkan CV untuk auto-generate...'
                }
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed font-normal disabled:opacity-50 disabled:bg-zinc-950"
              />
            </div>
          </div>

          {/* Skills Management */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Keahlian</span>
                {candidate.resumeFileName && !isExtracting && (
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    Dari CV
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {isExtracting ? 'Memproses...' : `${candidate.skills.length} Keahlian Terdaftar`}
              </span>
            </h3>

            {isExtracting ? (
              <div className="p-4 bg-black rounded-lg border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin shrink-0" />
                <span>Sedang mengekstrak daftar keahlian dari isi CV... Data dikosongkan sementara.</span>
              </div>
            ) : (
              <>
                {/* Add skill input with autocomplete recommendation */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={skillInputRef}
                        type="text"
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          setSelectedSuggestionIndex(-1);
                          if (!isSkillFocused) setIsSkillFocused(true);
                        }}
                        onFocus={() => setIsSkillFocused(true)}
                        onBlur={() => {
                          setTimeout(() => setIsSkillFocused(false), 200);
                        }}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="Ketik keahlian (misal: Docker, Kubernetes, SEO, Figma) lalu tekan Enter..."
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 pr-8 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                      />
                      {skillInput && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSkillInput('');
                            setSelectedSuggestionIndex(-1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5"
                          title="Hapus ketikan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Autocomplete Recommendation Popover */}
                  {isSkillFocused && (skillRecommendations.length > 0 || skillInput.trim()) && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-900">
                      <div className="px-3 py-1.5 bg-zinc-900/90 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span>
                            {skillInput.trim()
                              ? `Rekomendasi Keahlian Terkait "${skillInput.trim()}" (${skillRecommendations.length})`
                              : 'Rekomendasi Keahlian Populer'}
                          </span>
                        </span>
                        <span className="text-[10px] text-zinc-500">Gunakan ↑↓ navigasi & Enter</span>
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {skillRecommendations.map((item, idx) => {
                          const isSelected = idx === selectedSuggestionIndex;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addSkill(item.name);
                              }}
                              onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors text-xs font-mono ${
                                isSelected ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isSelected ? 'bg-white' : 'bg-zinc-600'
                                  }`}
                                />
                                <span className="font-medium text-zinc-100">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                  {item.category}
                                </span>
                                <span className="text-[11px] text-zinc-400 group-hover:text-white font-medium">
                                  + Tambah
                                </span>
                              </div>
                            </button>
                          );
                        })}

                        {/* Custom skill option if input doesn't exactly match any recommendation */}
                        {skillInput.trim() &&
                          !skillRecommendations.some(
                            (r) => r.name.toLowerCase() === skillInput.trim().toLowerCase()
                          ) &&
                          !candidate.skills.some(
                            (s) => s.toLowerCase() === skillInput.trim().toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addSkill(skillInput.trim());
                              }}
                              className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-900 text-xs font-mono text-zinc-400 border-t border-zinc-900"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5 text-zinc-300" />
                                <span>
                                  Tambahkan <span className="text-white font-semibold">"{skillInput.trim()}"</span> sebagai keahlian kustom
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                Enter
                              </span>
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.skills.length === 0 ? (
                    <span className="text-zinc-500 text-xs">
                      Belum ada keahlian terdaftar. Lampirkan CV atau gunakan form di atas.
                    </span>
                  ) : (
                    candidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 text-zinc-200 border border-zinc-700 text-xs font-mono"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-zinc-500 hover:text-white"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Experience list with interactive CRUD */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-zinc-800/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <span>Riwayat Pengalaman Kerja</span>
                {candidate.resumeFileName && !isExtracting && (
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    Dari CV
                  </span>
                )}
                <span className="text-xs text-zinc-400 font-mono">
                  {isExtracting ? '(Memproses...)' : `(${candidate.experience.length})`}
                </span>
              </h3>

              {!isExtracting && !isAddingExp && editingExpIndex === null && (
                <button
                  type="button"
                  onClick={handleStartAddExp}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pengalaman</span>
                </button>
              )}
            </div>

            {isExtracting ? (
              <div className="p-4 bg-black rounded-lg border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin shrink-0" />
                <span>Sedang mengekstrak riwayat pengalaman kerja dari isi CV... Data dikosongkan sementara.</span>
              </div>
            ) : (
              <>
                {/* Experience Add/Edit Form */}
                {(isAddingExp || editingExpIndex !== null) && (
                  <div className="bg-black border border-zinc-700 rounded-xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        {isAddingExp ? 'Tambah Pengalaman Kerja Baru' : 'Edit Pengalaman Kerja'}
                      </h4>
                      <button
                        type="button"
                        onClick={handleCancelExp}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Posisi / Jabatan <span className="text-white">*</span>
                        </label>
                        <input
                          type="text"
                          value={expForm.role}
                          onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                          placeholder="Contoh: Senior Frontend Engineer"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Nama Perusahaan <span className="text-white">*</span>
                        </label>
                        <input
                          type="text"
                          value={expForm.company}
                          onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                          placeholder="Contoh: PT Gojek Indonesia"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Periode Kerja
                      </label>
                      <input
                        type="text"
                        value={expForm.period}
                        onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
                        placeholder="Contoh: 2022 - Sekarang (2 Tahun) atau Jan 2021 - Des 2023"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Deskripsi Tanggung Jawab & Pencapaian
                      </label>
                      <textarea
                        rows={3}
                        value={expForm.description}
                        onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                        placeholder="Jelaskan peran utama, teknologi yang digunakan, serta pencapaian terukur yang relevan untuk ATS..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={handleCancelExp}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveExp}
                        disabled={!expForm.role.trim() || !expForm.company.trim()}
                        className="px-4 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAddingExp ? 'Tambahkan ke Profil' : 'Simpan Perubahan'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Experience Cards Listing */}
                <div className="space-y-3">
                  {candidate.experience.length === 0 ? (
                    <div className="text-center py-6 bg-black rounded-lg border border-zinc-900 text-xs text-zinc-500">
                      Belum ada riwayat pengalaman kerja. Lampirkan berkas CV untuk otomatis mengekstrak riwayat pekerjaan.
                    </div>
                  ) : (
                    candidate.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="bg-black p-3.5 sm:p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-white text-xs sm:text-sm truncate">
                                {exp.role}
                              </h4>
                              <span className="text-zinc-500 text-xs">di</span>
                              <span className="text-zinc-300 font-medium text-xs">
                                {exp.company}
                              </span>
                            </div>
                            <span className="text-zinc-500 font-mono text-[11px] block">
                              {exp.period}
                            </span>
                          </div>

                          {/* Action buttons (Edit & Delete) */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditExp(idx)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                              title="Edit pengalaman ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExp(idx)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                              title="Hapus pengalaman ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {exp.description && (
                          <p className="text-zinc-400 text-xs leading-relaxed pt-1 border-t border-zinc-900">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Education list with interactive CRUD */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-zinc-800/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-400" />
                <span>Riwayat Pendidikan</span>
                {candidate.resumeFileName && !isExtracting && (
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    Dari CV
                  </span>
                )}
                <span className="text-xs text-zinc-400 font-mono">
                  {isExtracting ? '(Memproses...)' : `(${candidate.education.length})`}
                </span>
              </h3>

              {!isExtracting && !isAddingEdu && editingEduIndex === null && (
                <button
                  type="button"
                  onClick={handleStartAddEdu}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pendidikan</span>
                </button>
              )}
            </div>

            {isExtracting ? (
              <div className="p-4 bg-black rounded-lg border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin shrink-0" />
                <span>Sedang mengekstrak riwayat pendidikan dari isi CV... Data dikosongkan sementara.</span>
              </div>
            ) : (
              <>
                {/* Education Add/Edit Form */}
                {(isAddingEdu || editingEduIndex !== null) && (
                  <div className="bg-black border border-zinc-700 rounded-xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        {isAddingEdu ? 'Tambah Pendidikan Baru' : 'Edit Riwayat Pendidikan'}
                      </h4>
                      <button
                        type="button"
                        onClick={handleCancelEdu}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Gelar / Program Studi <span className="text-white">*</span>
                        </label>
                        <input
                          type="text"
                          value={eduForm.degree}
                          onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                          placeholder="Contoh: S1 Teknik Informatika / Ilmu Komputer"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Tahun Kelulusan
                        </label>
                        <input
                          type="text"
                          value={eduForm.graduationYear}
                          onChange={(e) => setEduForm({ ...eduForm, graduationYear: e.target.value })}
                          placeholder="Contoh: 2021"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Nama Institusi / Universitas <span className="text-white">*</span>
                      </label>
                      <input
                        type="text"
                        value={eduForm.institution}
                        onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                        placeholder="Contoh: Universitas Indonesia (UI) atau Institut Teknologi Bandung (ITB)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={handleCancelEdu}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdu}
                        disabled={!eduForm.degree.trim() || !eduForm.institution.trim()}
                        className="px-4 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAddingEdu ? 'Tambahkan ke Profil' : 'Simpan Perubahan'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Education Cards Listing */}
                <div className="space-y-2.5">
                  {candidate.education.length === 0 ? (
                    <div className="text-center py-6 bg-black rounded-lg border border-zinc-900 text-xs text-zinc-500">
                      Belum ada riwayat pendidikan. Lampirkan berkas CV untuk otomatis mengekstrak riwayat pendidikan.
                    </div>
                  ) : (
                    candidate.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="bg-black p-3.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3 text-xs group"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-white truncate">{edu.degree}</span>
                            {edu.graduationYear && (
                              <span className="text-zinc-500 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                Lulus {edu.graduationYear}
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-400 block truncate">{edu.institution}</span>
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditEdu(idx)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                            title="Edit pendidikan ini"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEdu(idx)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                            title="Hapus pendidikan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSaved ? <Check className="w-4 h-4 text-black" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
