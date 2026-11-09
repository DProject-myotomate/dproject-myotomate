import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AuthUser, CandidateProfile } from '../types';
import { DEFAULT_CANDIDATES } from '../data/defaultCandidates';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser, initialProfile?: CandidateProfile) => void;
}

interface StoredAccount {
  user: AuthUser;
  passwordHash: string;
  candidateProfile?: CandidateProfile;
}

const STORAGE_USERS_KEY = 'autolamar_accounts_db';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // UI status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get all registered accounts
  const getStoredAccounts = (): StoredAccount[] => {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      if (data) {
        const accounts: StoredAccount[] = JSON.parse(data);
        return accounts.map((acc) => {
          const hasManual = localStorage.getItem(`autolamar_manual_cv_${acc.user.id}`) === 'true';
          if (!hasManual && acc.candidateProfile) {
            return {
              ...acc,
              candidateProfile: {
                ...acc.candidateProfile,
                resumeFileName: undefined,
                resumeFileSize: undefined,
              },
            };
          }
          return acc;
        });
      }
    } catch {
      // fallback
    }

    // Default pre-seeded demo accounts
    const initialAccounts: StoredAccount[] = [
      {
        user: {
          id: 'user-dimas',
          name: DEFAULT_CANDIDATES[0].fullName,
          email: DEFAULT_CANDIDATES[0].email,
          targetRole: DEFAULT_CANDIDATES[0].primaryRole,
          createdAt: '2026-01-15',
        },
        passwordHash: 'password123',
        candidateProfile: DEFAULT_CANDIDATES[0],
      },
      {
        user: {
          id: 'user-siti',
          name: DEFAULT_CANDIDATES[1].fullName,
          email: DEFAULT_CANDIDATES[1].email,
          targetRole: DEFAULT_CANDIDATES[1].primaryRole,
          createdAt: '2026-02-10',
        },
        passwordHash: 'password123',
        candidateProfile: DEFAULT_CANDIDATES[1],
      },
    ];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialAccounts));
    return initialAccounts;
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed || !loginPassword) {
      setErrorMsg('Mohon isi alamat email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getStoredAccounts();
      const matched = accounts.find(
        (acc) => acc.user.email.toLowerCase() === emailTrimmed
      );

      // Hanya izinkan user yang sudah terdaftar
      if (!matched) {
        setIsLoading(false);
        setErrorMsg(
          'Akun belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu melalui tab Daftar Akun.'
        );
        return;
      }

      // Validasi kecocokan kata sandi
      if (matched.passwordHash !== loginPassword) {
        setIsLoading(false);
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
        return;
      }

      setIsLoading(false);
      setSuccessMsg(`Selamat datang kembali, ${matched.user.name}!`);
      onLoginSuccess(matched.user, matched.candidateProfile);
    }, 450);
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = regFullName.trim();
    const email = regEmail.trim().toLowerCase();
    const role = 'Software Engineer';

    if (!name || !email || !regPassword) {
      setErrorMsg('Mohon lengkapi Nama, Email, dan Kata Sandi.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Format alamat email tidak valid.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreedTerms) {
      setErrorMsg('Harap setujui syarat dan ketentuan penggunaan.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getStoredAccounts();
      const existing = accounts.find((acc) => acc.user.email.toLowerCase() === email);

      if (existing) {
        setIsLoading(false);
        setErrorMsg('Email ini sudah terdaftar. Silakan gunakan tab Masuk.');
        return;
      }

      const newUserId = 'user-' + Date.now();
      const newUser: AuthUser = {
        id: newUserId,
        name,
        email,
        targetRole: role,
        createdAt: new Date().toISOString(),
      };

      // Create clean candidate profile for this user (NO automated CV until user attaches one)
      const initialProfile: CandidateProfile = {
        id: newUserId,
        fullName: name,
        email,
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

      const newAccount: StoredAccount = {
        user: newUser,
        passwordHash: regPassword,
        candidateProfile: initialProfile,
      };

      accounts.push(newAccount);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));

      setIsLoading(false);
      setSuccessMsg('Akun berhasil dibuat!');
      onLoginSuccess(newUser, initialProfile);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between py-10 px-4 selection:bg-white selection:text-black">
      {/* Background Decorative subtle grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header Brand */}
      <div className="relative max-w-md w-full mx-auto text-center mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          My Otomate
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Platform Otomasi Lamaran Kerja
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="relative max-w-md w-full mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-black border border-zinc-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg flex items-start gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ===================== TAB: LOGIN ===================== */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setErrorMsg(
                      'Silakan hubungi administrator atau buat akun baru di tab Daftar Akun.'
                    )
                  }
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-10 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-black border-zinc-700 text-white focus:ring-0"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-zinc-400 rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke My Otomate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 text-center">
              <p className="text-xs text-zinc-400">
                Belum memiliki akun terdaftar?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-white font-semibold underline underline-offset-4 hover:text-zinc-200 transition-colors"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ===================== TAB: REGISTER ===================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="budi.santoso@email.com"
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Ulangi Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Sama dengan sandi"
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-zinc-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded bg-black border-zinc-700 text-white focus:ring-0"
              />
              <span className="text-[11px] leading-relaxed">
                Saya menyetujui Ketentuan Penggunaan dan Kebijakan Privasi My Otomate.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-zinc-400 rounded-full animate-spin" />
                  <span>Mendaftarkan akun...</span>
                </>
              ) : (
                <>
                  <span>Buat Akun & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-zinc-400">
                Sudah memiliki akun terdaftar?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-white font-semibold underline underline-offset-4 hover:text-zinc-200 transition-colors"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Footer Security Note */}
      <div className="relative max-w-md w-full mx-auto text-center mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <ShieldCheck className="w-4 h-4 text-zinc-400" />
        <span>Data berkas & kredensial tersimpan aman dan terenkripsi secara lokal.</span>
      </div>
    </div>
  );
};
