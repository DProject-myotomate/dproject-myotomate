import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Job, WorkMode, JobLevel } from '../types';

interface CustomJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: Job) => void;
}

export const CustomJobModal: React.FC<CustomJobModalProps> = ({
  isOpen,
  onClose,
  onAddJob,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Jakarta (Hybrid)');
  const [workMode, setWorkMode] = useState<WorkMode>('Hybrid');
  const [level, setLevel] = useState<JobLevel>('Mid-Level');
  const [department, setDepartment] = useState('Engineering');
  const [salaryRange, setSalaryRange] = useState('Rp 15.000.000 - Rp 25.000.000 / bln');
  const [hrEmail, setHrEmail] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Tailwind CSS');
  const [requirementsInput, setRequirementsInput] = useState(
    'Pengalaman kerja minimal 2 tahun\nMampu berkolaborasi dalam tim\nMemahami REST API'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedReqs = requirementsInput
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const newJob: Job = {
      id: 'custom-' + Date.now().toString(36),
      title,
      company,
      location,
      workMode,
      level,
      department,
      salaryRange: salaryRange || 'Negosiasi',
      postedDate: 'Baru ditambahkan',
      source: 'Direct HR',
      hrEmail: hrEmail || `hr@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      description: description || `Lowongan ${title} di ${company}`,
      requirements: parsedReqs.length > 0 ? parsedReqs : ['Kualifikasi sesuai bidang terkait'],
      skills: parsedSkills.length > 0 ? parsedSkills : ['Communication', 'Teamwork'],
      screeningQuestions: [
        'Kapan ketersediaan tanggal mulai kerja Anda?',
        'Berapa ekspektasi gaji Anda?',
      ],
      companyInitial: company.substring(0, 2).toUpperCase(),
      logoBg: 'bg-zinc-800',
    };

    onAddJob(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Tambah Lowongan Kerja Kustom</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Masukkan info lowongan dari Glints, JobStreet, atau LinkedIn untuk dimasukkan ke antrean
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Posisi / Judul Pekerjaan *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="misal: Senior Frontend Developer"
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Nama Perusahaan *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="misal: PT Tech Nusantara"
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Mode Kerja</label>
              <select
                value={workMode}
                onChange={(e: any) => setWorkMode(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Level Posisi</label>
              <select
                value={level}
                onChange={(e: any) => setLevel(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="Fresh Graduate">Fresh Graduate</option>
                <option value="Junior">Junior</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead / Manager">Lead / Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jakarta / Bandung / Remote"
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Email HR Rekruter</label>
              <input
                type="email"
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
                placeholder="recruitment@perusahaan.com"
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Rentang Gaji (Opsional)</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="Rp 15.000.000 - Rp 25.000.000"
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Keahlian yang Dibutuhkan (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, Node.js, Tailwind CSS"
              className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Deskripsi & Ringkasan Lowongan</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Salin atau ketik poin deskripsi pekerjaan..."
              className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Lowongan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
