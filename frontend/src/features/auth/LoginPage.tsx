import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import api, { authApi } from '@/api/client'
import {
  TurtleIcon, LockIcon, PhoneIcon, MailIcon, EyeIcon,
  CheckIcon, ShieldIcon, UsersIcon,
} from '@/components/Icons'

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const COUNTRY_CODES = [
  { code: '+86', label: 'CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: '+1', label: 'US', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: '+44', label: 'GB', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: '+81', label: 'JP', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: '+82', label: 'KR', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: '+61', label: 'AU', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: '+49', label: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: '+33', label: 'FR', flag: '\u{1F1EB}\u{1F1F7}' },
]

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [mode, setMode] = useState<'pw' | 'ph' | 'em'>('pw')
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [pw, setPw] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [cc, setCc] = useState('+86')
  const [ccOpen, setCcOpen] = useState(false)
  const ccRef = useRef<HTMLDivElement>(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Email OTP state
  const [emailForOtp, setEmailForOtp] = useState('')
  const [emailForOtpTouched, setEmailForOtpTouched] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [emailCode, setEmailCode] = useState(['', '', '', '', '', ''])
  const emailCodeRefs = useRef<(HTMLInputElement | null)[]>([])
  const [emailCountdown, setEmailCountdown] = useState(0)

  // Close country-code dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ccRef.current && !ccRef.current.contains(e.target as Node)) setCcOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Countdown timer for resend (phone)
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Countdown timer for resend (email)
  useEffect(() => {
    if (emailCountdown <= 0) return
    const timer = setTimeout(() => setEmailCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [emailCountdown])

  const selectedCc = COUNTRY_CODES.find(c => c.code === cc) || COUNTRY_CODES[0]

  const handleLogin = async () => {
    setError('')
    if (!email || !isValidEmail(email)) {
      setEmailTouched(true)
      return
    }
    setSubmitting(true)
    try {
      await login(email, pw)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setError(t('auth.too_many_attempts'))
      } else if (status === 422) {
        setError(t('auth.email_required'))
      } else if (status === 401) {
        setError(t('auth.invalid_credentials'))
      } else {
        setError(t('auth.login_failed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!email || !isValidEmail(email)) {
      setEmailTouched(true)
      return
    }
    if (!displayName.trim()) {
      setError(t('auth.name_required'))
      return
    }
    if (pw.length < 8) {
      setError(t('auth.password_min_length'))
      return
    }
    setSubmitting(true)
    try {
      await register(email, pw, displayName.trim())
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } }
      if (e?.response?.status === 422) {
        setError(t('auth.email_required'))
      } else {
        const msg = e?.response?.data?.error?.message
        setError(msg || t('auth.register_failed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendCode = async () => {
    if (!phone || phone.length < 5) {
      setError(t('auth.phone_required'))
      return
    }
    setError('')
    setSending(true)
    try {
      await api.post('/auth/sms/send', { phone, country_code: cc })
      setSent(true)
      setCountdown(60)
      // Auto-focus first code input
      setTimeout(() => codeRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || t('auth.send_code_failed'))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError(t('auth.code_incomplete'))
      return
    }
    setError('')
    setVerifying(true)
    try {
      const resp = await api.post('/auth/sms/verify', { phone, code: fullCode })
      const { access_token, refresh_token, user } = resp.data
      // Store auth state
      useAuthStore.getState().setAuth(access_token, refresh_token, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || t('auth.verify_failed'))
    } finally {
      setVerifying(false)
    }
  }

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    const next = [...code]
    next[index] = value.replace(/\D/g, '')
    setCode(next)
    // Auto-advance to next input
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  // Email OTP handlers
  const handleEmailSendCode = async () => {
    if (!emailForOtp || !isValidEmail(emailForOtp)) {
      setEmailForOtpTouched(true)
      return
    }
    setError('')
    setEmailSending(true)
    try {
      await authApi.sendEmailCode(emailForOtp, i18n.language?.startsWith('zh') ? 'zh' : 'en')
      setEmailSent(true)
      setEmailCountdown(60)
      setTimeout(() => emailCodeRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      const msg = e?.response?.data?.error?.message || e?.response?.data?.detail
      setError(msg || t('auth.email_send_failed'))
    } finally {
      setEmailSending(false)
    }
  }

  const handleEmailVerify = async () => {
    const fullCode = emailCode.join('')
    if (fullCode.length !== 6) {
      setError(t('auth.code_incomplete'))
      return
    }
    setError('')
    setEmailVerifying(true)
    try {
      const resp = await authApi.verifyEmailCode({ email: emailForOtp, code: fullCode })
      const { access_token, refresh_token, user } = resp.data
      useAuthStore.getState().setAuth(access_token, refresh_token, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      const msg = e?.response?.data?.error?.message || e?.response?.data?.detail
      setError(msg || t('auth.email_verify_failed'))
    } finally {
      setEmailVerifying(false)
    }
  }

  const handleEmailCodeInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    const next = [...emailCode]
    next[index] = value.replace(/\D/g, '')
    setEmailCode(next)
    if (value && index < 5) {
      emailCodeRefs.current[index + 1]?.focus()
    }
  }

  const handleEmailCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !emailCode[index] && index > 0) {
      emailCodeRefs.current[index - 1]?.focus()
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-20">
      <div className="w-full max-w-[440px] bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <TurtleIcon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">
            {isSignUp ? t('auth.create_account') : t('auth.welcome_back')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSignUp ? t('auth.join_littleturtle') : t('auth.sign_in_to')}
          </p>
        </div>

        {/* Mode toggle (only for sign-in) */}
        {!isSignUp && (
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6">
            <button onClick={() => setMode('pw')} className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition ${mode === 'pw' ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500'}`}>
              <LockIcon /> {t('auth.password')}
            </button>
            <button onClick={() => setMode('ph')} className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition ${mode === 'ph' ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500'}`}>
              <PhoneIcon /> {t('auth.phone')}
            </button>
            <button onClick={() => setMode('em')} className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition ${mode === 'em' ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500'}`}>
              <MailIcon /> {t('auth.email_otp')}
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        {isSignUp ? (
          /* ========== SIGN UP FORM ========== */
          <>
            {/* Name */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.display_name')}</label>
              <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
                <span className="text-slate-500 mr-3"><UsersIcon /></span>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('auth.display_name_placeholder')} maxLength={100} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
              </div>
            </div>
            {/* Email */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.email')}</label>
              <div className={`flex items-center bg-white/[0.05] border rounded-xl px-4 py-3 transition-all ${emailTouched && email && !isValidEmail(email) ? 'border-red-400/60' : 'border-white/10 focus-within:border-emerald-500/40'}`}>
                <span className="text-slate-500 mr-3"><MailIcon /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder={t('auth.email_placeholder')} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
                {isValidEmail(email) && <CheckIcon />}
              </div>
              {emailTouched && email && !isValidEmail(email) && (
                <p className="text-[11px] text-amber-400 mt-1.5">{t('auth.email_format_hint')}</p>
              )}
            </div>
            {/* Password */}
            <div className="mb-6">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.password')}</label>
              <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
                <span className="text-slate-500 mr-3"><LockIcon /></span>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder={t('auth.password_placeholder')} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
                <button onClick={() => setShowPw(!showPw)} className="text-slate-500"><EyeIcon closed={!showPw} /></button>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">{t('auth.password_hint')}</p>
            </div>
            <button
              onClick={handleRegister}
              disabled={isLoading || !isValidEmail(email) || !pw || !displayName.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
            >
              {submitting ? '...' : t('auth.sign_up')}
            </button>
          </>
        ) : mode === 'pw' ? (
          /* ========== SIGN IN (PASSWORD) ========== */
          <>
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.email')}</label>
              <div className={`flex items-center bg-white/[0.05] border rounded-xl px-4 py-3 transition-all ${emailTouched && email && !isValidEmail(email) ? 'border-red-400/60' : 'border-white/10 focus-within:border-emerald-500/40'}`}>
                <span className="text-slate-500 mr-3"><MailIcon /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder={t('auth.email_placeholder')} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
                {isValidEmail(email) && <CheckIcon />}
              </div>
              {emailTouched && email && !isValidEmail(email) && (
                <p className="text-[11px] text-amber-400 mt-1.5">{t('auth.email_format_hint')}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.password')}</label>
              <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
                <span className="text-slate-500 mr-3"><LockIcon /></span>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder={t('auth.enter_password')} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
                <button onClick={() => setShowPw(!showPw)} className="text-slate-500"><EyeIcon closed={!showPw} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <span className="text-[12px] text-slate-400">{t('auth.remember_me')}</span>
              </label>
              <button className="text-[12px] text-emerald-400 font-semibold">{t('auth.forgot_password')}</button>
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
            >
              {submitting ? '...' : t('auth.sign_in')}
            </button>
          </>
        ) : mode === 'ph' ? (
          /* ========== SIGN IN (PHONE) ========== */
          <>
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.phone')}</label>
              <div className="flex gap-2">
                {/* Custom country code dropdown */}
                <div className="relative" ref={ccRef}>
                  <button
                    type="button"
                    onClick={() => setCcOpen(!ccOpen)}
                    className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-3 hover:bg-white/[0.08] transition-colors min-w-[100px]"
                  >
                    <span className="text-base">{selectedCc.flag}</span>
                    <span className="text-sm font-semibold text-white">{selectedCc.label} {selectedCc.code}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6" className={`ml-auto text-slate-400 transition-transform ${ccOpen ? 'rotate-180' : ''}`}>
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>
                  {ccOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[160px] bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {COUNTRY_CODES.map(item => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => { setCc(item.code); setCcOpen(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                            cc === item.code
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'text-slate-300 hover:bg-white/[0.08]'
                          }`}
                        >
                          <span className="text-base">{item.flag}</span>
                          <span className="font-medium">{item.label}</span>
                          <span className="ml-auto text-slate-500">{item.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder={t('auth.phone_placeholder')} maxLength={15} className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600" />
                </div>
              </div>
            </div>

            {sent && (
              <div className="mb-5">
                <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.verification_code')}</label>
                <div className="flex gap-2 justify-between">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { codeRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-lg font-bold rounded-xl border outline-none transition ${d ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.05] text-white focus:border-emerald-400'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2">
                    <CheckIcon />
                    <span className="text-[11px] text-emerald-300">{t('auth.code_sent')} {cc} ****{phone.slice(-4) || '0000'}</span>
                  </div>
                  {countdown > 0 ? (
                    <span className="text-[11px] text-slate-500">{countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sending}
                      className="text-[11px] text-emerald-400 font-semibold hover:text-emerald-300"
                    >
                      {t('auth.resend_code')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={sent ? handleVerify : handleSendCode}
              disabled={sending || verifying || (!sent && phone.length < 5)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
            >
              {sending ? '...' : verifying ? '...' : sent ? t('auth.verify_sign_in') : t('auth.send_code')}
            </button>
          </>
        ) : (
          /* ========== SIGN IN (EMAIL OTP) ========== */
          <>
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.email')}</label>
              <div className={`flex items-center bg-white/[0.05] border rounded-xl px-4 py-3 transition-all ${emailForOtpTouched && emailForOtp && !isValidEmail(emailForOtp) ? 'border-red-400/60' : 'border-white/10 focus-within:border-emerald-500/40'}`}>
                <span className="text-slate-500 mr-3"><MailIcon /></span>
                <input
                  type="email"
                  value={emailForOtp}
                  onChange={e => setEmailForOtp(e.target.value)}
                  onBlur={() => setEmailForOtpTouched(true)}
                  placeholder={t('auth.email_placeholder_otp')}
                  className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-slate-600"
                />
                {isValidEmail(emailForOtp) && <CheckIcon />}
              </div>
              {emailForOtpTouched && emailForOtp && !isValidEmail(emailForOtp) && (
                <p className="text-[11px] text-amber-400 mt-1.5">{t('auth.email_format_hint')}</p>
              )}
            </div>

            {emailSent && (
              <div className="mb-5">
                <label className="text-[12px] font-semibold text-slate-400 mb-2 block">{t('auth.verification_code')}</label>
                <div className="flex gap-2 justify-between">
                  {emailCode.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { emailCodeRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleEmailCodeInput(i, e.target.value)}
                      onKeyDown={e => handleEmailCodeKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-lg font-bold rounded-xl border outline-none transition ${d ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.05] text-white focus:border-emerald-400'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2">
                    <CheckIcon />
                    <span className="text-[11px] text-emerald-300">
                      {t('auth.code_sent')} {emailForOtp.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => f + '*'.repeat(m.length) + d)}
                    </span>
                  </div>
                  {emailCountdown > 0 ? (
                    <span className="text-[11px] text-slate-500">{emailCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEmailSendCode}
                      disabled={emailSending}
                      className="text-[11px] text-emerald-400 font-semibold hover:text-emerald-300"
                    >
                      {t('auth.resend_code')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={emailSent ? handleEmailVerify : handleEmailSendCode}
              disabled={emailSending || emailVerifying || (!emailSent && !isValidEmail(emailForOtp))}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
            >
              {emailSending ? '...' : emailVerifying ? '...' : emailSent ? t('auth.email_verify_sign_in') : t('auth.send_code')}
            </button>
          </>
        )}

        {/* OAuth */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{t('auth.or_continue')}</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="flex gap-3">
          {['Google', 'Apple', 'WeChat'].map(n => (
            <button key={n} className="flex-1 flex items-center justify-center py-2.5 bg-white/[0.05] border border-white/10 rounded-xl hover:bg-white/[0.08] transition text-sm text-slate-300 font-medium">
              {n}
            </button>
          ))}
        </div>

        {/* Toggle sign-in / sign-up */}
        <div className="text-center mt-6">
          {isSignUp ? (
            <>
              <span className="text-[12px] text-slate-500">{t('auth.have_account')} </span>
              <button onClick={toggleMode} className="text-[12px] text-emerald-400 font-bold">{t('auth.sign_in')}</button>
            </>
          ) : (
            <>
              <span className="text-[12px] text-slate-500">{t('auth.no_account')} </span>
              <button onClick={toggleMode} className="text-[12px] text-emerald-400 font-bold">{t('auth.sign_up')}</button>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <ShieldIcon />
          <span className="text-[10px] text-slate-500">{t('auth.encrypted_hipaa')}</span>
        </div>
      </div>
    </div>
  )
}
