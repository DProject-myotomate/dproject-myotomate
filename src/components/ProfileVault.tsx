import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { DEFAULT_CANDIDATES } from '../data/defaultCandidates';

interface ProfileVaultProps {
  candidate: CandidateProfile;
  setCandidate: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  onSaveNotification: () => void;
}

export const ProfileVault: React.FC<ProfileVaultProps> = ({
  candidate,
  setCandidate,
  onSaveNotification,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [isOptimizingSummary, setIsOptimizingSummary] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  const processFile = async (file: File) => {
    if (!file) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);
    setExtractionStep(`Membaca berkas ${file.name}...`);

    try {
      const fileSizeFormatted = formatFileSize(file.size);
      let fileData = '';
      let fileText = '';

      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        fileText = await file.text();
      }

      setExtractionStep('Mengonversi berkas untuk pemindaian...');
      fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setExtractionStep('AI Gemini sedang menganalisis nama, kontak, dan riwayat karir...');
      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          fileSize: fileSizeFormatted,
          fileData,
          fileText,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.candidate) {
        setExtractionStep('Menyelaraskan data ke kolom profil...');
        const parsed = resData.candidate;
        setCandidate((prev) => ({
          ...prev,
          fullName: parsed.fullName || prev.fullName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          location: parsed.location || prev.location,
          primaryRole: parsed.primaryRole || prev.primaryRole,
          experienceYears:
            typeof parsed.experienceYears === 'number'
              ? parsed.experienceYears
              : prev.experienceYears,
          expectedSalary: parsed.expectedSalary || prev.expectedSalary,
          availability: parsed.availability || prev.availability,
          linkedin: parsed.linkedin || prev.linkedin,
          github: parsed.github || prev.github,
          portfolio: parsed.portfolio || prev.portfolio,
          summary: parsed.summary || prev.summary,
          skills:
            Array.isArray(parsed.skills) && parsed.skills.length > 0
              ? parsed.skills
              : prev.skills,
          experience:
            Array.isArray(parsed.experience) && parsed.experience.length > 0
              ? parsed.experience
              : prev.experience,
          education:
            Array.isArray(parsed.education) && parsed.education.length > 0
              ? parsed.education
              : prev.education,
          resumeFileName: file.name,
          resumeFileSize: `${fileSizeFormatted} (Terisi Otomatis via AI)`,
        }));
        setExtractSuccess(true);
        onSaveNotification();
      } else {
        throw new Error(resData.error || 'Gagal mengekstrak data dari berkas');
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

  const handleLoadDemoCV = async () => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);
    setExtractionStep('Memuat berkas contoh CV_Rian_Hidayat_Fullstack.pdf...');
    try {
      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'CV_Rian_Hidayat_Fullstack_Lead_2026.pdf',
          fileType: 'application/pdf',
          fileSize: '412 KB',
          fileText: `Rian Hidayat, S.Kom
Email: rian.hidayat.dev@gmail.com | Telp: +62 811-2233-7788 | Domisili: Jakarta Selatan, DKI Jakarta
LinkedIn: linkedin.com/in/rian-hidayat-tech | GitHub: github.com/rianhidayat | Portofolio: rianhidayat.io
Target Posisi: Lead Fullstack Software Engineer | Pengalaman: 5 Tahun | Ekspektasi Gaji: Rp 28.000.000 / bulan | Notice: Siap bergabung segera

RINGKASAN EKSEKUTIF:
Lead Fullstack Engineer berpengalaman 5+ tahun memimpin rekayasa web skala besar dengan React, TypeScript, Next.js, Node.js, dan PostgreSQL. Berpengalaman merancang arsitektur microservices dan sistem pemrosesan transaksi tinggi dengan standar ATS terbaik.

KEAHLIAN UTAMA:
React, TypeScript, Next.js, Node.js, PostgreSQL, Docker, Tailwind CSS, Redis, REST API, GraphQL, CI/CD, Agile / Scrum.

RIWAYAT PENGALAMAN KERJA:
1. Lead Fullstack Engineer - PT Inovasi Finansial Nusantara (2022 - Sekarang)
Memimpin tim rekayasa dalam membangun sistem core dengan latensi rendah dan ketersediaan 99.9%.
2. Senior Frontend Developer - TokoKarya Digital (2020 - 2022)
Membangun web app berkinerja tinggi yang mengerek performa loading hingga 40%.

RIWAYAT PENDIDIKAN:
S1 Sistem Informasi - Institut Teknologi Bandung (ITB), Lulus 2020.`,
        }),
      });
      const resData = await response.json();
      if (resData.candidate) {
        setCandidate((prev) => ({
          ...prev,
          ...resData.candidate,
          id: prev.id,
          resumeFileName: 'CV_Rian_Hidayat_Fullstack_Lead_2026.pdf',
          resumeFileSize: '412 KB (Terisi Otomatis via AI)',
        }));
        setExtractSuccess(true);
        onSaveNotification();
      }
    } catch (err: any) {
      setExtractError(err.message || 'Gagal memuat demo CV');
    } finally {
      setIsExtracting(false);
      setExtractionStep('');
    }
  };

  const handleRemoveAttachedCV = () => {
    setCandidate((prev) => ({
      ...prev,
      resumeFileName: undefined,
      resumeFileSize: undefined,
    }));
    setExtractSuccess(false);
  };

  // Switch preset profile for instant testing
  const handleSelectPreset = (presetId: string) => {
    const found = DEFAULT_CANDIDATES.find((c) => c.id === presetId);
    if (found) {
      setCandidate({ ...found });
    }
  };

  // Add new skill tag
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !candidate.skills.includes(clean)) {
      setCandidate((prev) => ({
        ...prev,
        skills: [...prev.skills, clean],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCandidate((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
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
      {/* Top Banner & Profile Switcher - Monochrome Black & White */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Profil Pelamar & Berkas Karir
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Data di bawah ini digunakan oleh mesin AI untuk mempersonalisasi surat lamaran, menjawab kuis seleksi HR, dan menghitung skor ATS.
            </p>
          </div>

          {/* Quick preset selector - Black & White */}
          <div className="flex items-center gap-1.5 bg-black p-1.5 rounded-lg border border-zinc-800 text-xs">
            <span className="text-zinc-500 pl-2">Preset:</span>
            {DEFAULT_CANDIDATES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                  candidate.id === preset.id
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {preset.primaryRole.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

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
              <span className="text-white">Attach CV & Ekstraksi Data Otomatis</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Lampirkan Berkas CV / Resume ATS
            </h3>
            <p className="text-xs text-zinc-400">
              Unggah berkas CV Anda. AI akan secara otomatis membaca dan mengisi kolom nama, kontak, ringkasan, riwayat kerja, dan keahlian di bawah ini.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadDemoCV}
              disabled={isExtracting}
              className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Gunakan contoh CV untuk menguji fitur pengisian otomatis"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Contoh CV Demo (1-Klik)</span>
            </button>

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
        {candidate.resumeFileName && (
          <div className="bg-black border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-white shrink-0" />
              <div className="min-w-0 truncate">
                <span className="font-medium text-white truncate block">
                  {candidate.resumeFileName}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {candidate.resumeFileSize || 'Terlampir'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                title="Hapus lampiran CV"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              <span>Identitas & Kontak Utama</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={candidate.fullName}
                  onChange={(e) => setCandidate({ ...candidate, fullName: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Aktif</label>
                <input
                  type="email"
                  value={candidate.email}
                  onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={candidate.phone}
                  onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Domisili / Lokasi</label>
                <input
                  type="text"
                  value={candidate.location}
                  onChange={(e) => setCandidate({ ...candidate, location: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ekspektasi Gaji Bulanan</label>
                <input
                  type="text"
                  value={candidate.expectedSalary}
                  onChange={(e) => setCandidate({ ...candidate, expectedSalary: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ketersediaan Bergabung</label>
                <input
                  type="text"
                  value={candidate.availability}
                  onChange={(e) => setCandidate({ ...candidate, availability: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-zinc-400" />
              <span>Tautan Portofolio & Jejaring</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Profil LinkedIn</label>
                <input
                  type="text"
                  value={candidate.linkedin}
                  onChange={(e) => setCandidate({ ...candidate, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/username"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">GitHub / Repositori (Opsional)</label>
                <input
                  type="text"
                  value={candidate.github || ''}
                  onChange={(e) => setCandidate({ ...candidate, github: e.target.value })}
                  placeholder="github.com/username"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Website Portofolio</label>
                <input
                  type="text"
                  value={candidate.portfolio || ''}
                  onChange={(e) => setCandidate({ ...candidate, portfolio: e.target.value })}
                  placeholder="portofolio-anda.com"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Interactive Resume Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-semibold text-white block truncate">
                  {candidate.resumeFileName || 'Belum Ada CV Terlampir'}
                </span>
                <span className="text-zinc-400 block text-[11px] truncate">
                  {candidate.resumeFileSize || 'Lampirkan untuk auto-fill profil'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="flex-1 py-1.5 px-3 text-xs font-medium bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>{candidate.resumeFileName ? 'Ganti CV' : 'Lampirkan CV'}</span>
              </button>
              {candidate.resumeFileName && (
                <button
                  type="button"
                  onClick={handleRemoveAttachedCV}
                  className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Professional Role, Summary, Skills, Experience */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role & Summary */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Profesi Utama / Target Posisi</label>
                <input
                  type="text"
                  value={candidate.primaryRole}
                  onChange={(e) => setCandidate({ ...candidate, primaryRole: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Total Pengalaman (Tahun)</label>
                <input
                  type="number"
                  value={candidate.experienceYears}
                  onChange={(e) =>
                    setCandidate({ ...candidate, experienceYears: Number(e.target.value) })
                  }
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-zinc-400 font-medium">
                  Ringkasan Profil Profesional (Untuk ATS)
                </label>
                <button
                  type="button"
                  onClick={handleOptimizeSummary}
                  disabled={isOptimizingSummary}
                  className="text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isOptimizingSummary ? 'Mengoptimalkan...' : 'Poles Ringkasan AI'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={candidate.summary}
                onChange={(e) => setCandidate({ ...candidate, summary: e.target.value })}
                placeholder="Tuliskan ringkasan karir Anda..."
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed font-normal"
              />
            </div>
          </div>

          {/* Skills Management */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Keahlian & Kata Kunci ATS ({candidate.skills.length})</span>
            </h3>

            {/* Add skill input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Ketik keahlian (misal: Docker, Kubernetes, SEO, Figma) lalu tekan Enter..."
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Skill tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {candidate.skills.map((skill, idx) => (
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
              ))}
            </div>
          </div>

          {/* Experience list */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-400" />
              <span>Riwayat Pengalaman Kerja</span>
            </h3>

            <div className="space-y-3">
              {candidate.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="bg-black p-3.5 rounded-lg border border-zinc-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{exp.role}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{exp.period}</span>
                  </div>
                  <span className="text-zinc-300 font-medium block">{exp.company}</span>
                  <p className="text-zinc-400 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education list */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-zinc-400" />
              <span>Riwayat Pendidikan</span>
            </h3>

            <div className="space-y-2.5">
              {candidate.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="bg-black p-3 rounded-lg border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{edu.degree}</span>
                    <span className="text-zinc-400 block">{edu.institution}</span>
                  </div>
                  <span className="text-zinc-500 font-mono">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
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
