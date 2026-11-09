import React, { useState } from 'react';
import { X, Copy, Check, Mail, Send } from 'lucide-react';
import { ApplicationRecord, CandidateProfile } from '../types';

interface FollowUpModalProps {
  application: ApplicationRecord | null;
  candidate: CandidateProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  application,
  candidate,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [timing, setTiming] = useState<'3days' | '7days' | 'post_interview'>('3days');

  if (!isOpen || !application) return null;

  const getTemplate = () => {
    if (timing === 'post_interview') {
      return `Yth. Tim Rekrutmen & Interviewer ${application.company},

Terima kasih banyak atas kesempatan wawancara yang telah diberikan sebelumnya untuk posisi ${application.jobTitle}. Saya sangat terkesan dengan pemaparan visi perusahaan dan semakin antusias untuk dapat berkontribusi dalam tim.

Jika terdapat informasi tambahan atau berkas pendukung lain yang dibutuhkan, mohon tidak ragu untuk mengabari saya.

Hormat saya,

${candidate.fullName}
${candidate.email} | ${candidate.phone}`;
    }

    if (timing === '7days') {
      return `Yth. Tim Rekrutmen & HRD ${application.company},

Dengan hormat,

Semoga Bapak/Ibu dalam keadaan sehat. Menindaklanjuti lamaran pekerjaan yang telah saya kirimkan pada tanggal ${application.appliedAt} untuk posisi ${application.jobTitle} (No. Pelacakan: ${application.trackingId}), saya ingin menanyakan kabar terbaru terkait proses rekrutmen tersebut.

Saya tetap sangat tertarik untuk berdiskusi lebih lanjut mengenai bagaimana keahlian saya dapat mendukung pencapaian target tim ${application.company}.

Terima kasih atas waktu dan perhatian Bapak/Ibu.

Hormat saya,

${candidate.fullName}
${candidate.email} | ${candidate.phone}`;
    }

    // Default 3 days
    return `Yth. Tim HRD ${application.company},

Selamat pagi/siang,

Saya ingin mengonfirmasi penerimaan berkas lamaran saya untuk posisi ${application.jobTitle} yang telah saya kirimkan beberapa hari yang lalu (ID Pelacakan: ${application.trackingId}).

Saya sangat siap untuk mengikuti tahapan seleksi berikutnya dan mendiskusikan kualifikasi saya lebih mendalam.

Terima kasih banyak.

Hormat saya,

${candidate.fullName}
${candidate.email} | ${candidate.phone}`;
  };

  const bodyText = getTemplate();

  const handleCopy = () => {
    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoSubject = encodeURIComponent(`Follow Up Lamaran: ${application.jobTitle} - ${candidate.fullName}`);
  const mailtoUrl = `mailto:${application.hrEmail}?subject=${mailtoSubject}&body=${encodeURIComponent(bodyText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white" />
            <h3 className="text-base font-bold text-white">Template Email Follow-Up HR</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Target: <span className="font-semibold text-white">{application.company}</span> ({application.jobTitle}) · ID: <span className="font-mono text-zinc-300">{application.trackingId}</span>
        </div>

        {/* Timing options */}
        <div className="flex items-center gap-1.5 bg-black p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setTiming('3days')}
            className={`flex-1 py-1.5 rounded font-medium transition-colors ${
              timing === '3days' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Follow-Up 3 Hari
          </button>
          <button
            onClick={() => setTiming('7days')}
            className={`flex-1 py-1.5 rounded font-medium transition-colors ${
              timing === '7days' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Follow-Up 1 Minggu
          </button>
          <button
            onClick={() => setTiming('post_interview')}
            className={`flex-1 py-1.5 rounded font-medium transition-colors ${
              timing === 'post_interview' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pasca Wawancara
          </button>
        </div>

        {/* Text Preview */}
        <textarea
          readOnly
          value={bodyText}
          rows={9}
          className="w-full bg-black border border-zinc-800 rounded-lg p-3.5 text-xs text-zinc-200 font-sans leading-relaxed resize-none focus:outline-none"
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
          </button>

          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim via Email Client</span>
          </a>
        </div>
      </div>
    </div>
  );
};
