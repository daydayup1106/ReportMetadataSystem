/* Inline SVG icons used across the app — ported from the original JSX design. */

export const TurtleIcon = ({ size = 24 }: { size?: number }) => (
  <span style={{ fontSize: size * 0.65 }}>🐢</span>
)

export const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2a5 5 0 00-5 5v3l-2 3h14l-2-3V7a5 5 0 00-5-5zM8 16a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const MicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="8" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 10a6 6 0 0012 0M11 16v4m-3 0h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 7h2l2-3h8l2 3h2a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="11" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M4 3h10l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 12h8M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 19V12M8 19V8M13 19V5M18 19V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 13c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="4" y="6" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="13.5" cy="12" r="1.5" fill="currentColor" />
    <path d="M11 2v4M7 4h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 10l14-7-7 14-2-5-5-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

export const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill={filled ? "#ef4444" : "none"}>
    <path d="M10 17S2 12 2 7.5C2 4.5 4.5 2 7 2c1.5 0 2.5.8 3 2 .5-1.2 1.5-2 3-2 2.5 0 5 2.5 5 5.5C18 12 10 17 10 17z" stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="1.5" />
  </svg>
)

export const MsgIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 16c4.4 0 8-3.1 8-7s-3.6-7-8-7-8 3.1-8 7c0 1.7.7 3.3 1.8 4.5L2 16l3.5-1.2c1.1.5 2.3.7 3.5.7z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const UpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 12l4-4 3 3 5-7" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 4h4v4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const DownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4l4 4 3-3 5 7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 12h4v-4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M6 10l6-4M6 8l6 4M5 10a2 2 0 100-4 2 2 0 000 4zm8-4a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5L2.5 4.5v4c0 4.14 2.78 8.01 6.5 9 3.72-.99 6.5-4.86 6.5-9v-4L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M6.5 9l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const EyeIcon = ({ closed }: { closed?: boolean }) =>
  closed ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 9s3-5.5 7-5.5S16 9 16 9s-3 5.5-7 5.5S2 9 2 9z" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 9s3-5.5 7-5.5S16 9 16 9s-3 5.5-7 5.5S2 9 2 9z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )

export const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="4" y="1" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="9" y1="14" x2="9.01" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#16A34A" strokeWidth="1.5" />
    <path d="M5.5 8l2 2 3.5-3.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const RightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 3h14M5 9h8M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 7h14M6 1v4M12 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 14V4m0 0l-4 4m4-4l4 4M3 14v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? "#FBBF24" : "#4B5563"}>
    <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4 3.3 12.3l.7-4.1-3-2.9 4.2-.7L7 1z" />
  </svg>
)

export const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 10l7-7 7 7v7a1 1 0 01-1 1h-3v-4H7v4H4a1 1 0 01-1-1v-7z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 10h15M10 2.5c2 2.5 3 5 3 7.5s-1 5-3 7.5M10 2.5c-2 2.5-3 5-3 7.5s1 5 3 7.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="5" y="5" width="10" height="10" rx="1.5" fill="currentColor" />
  </svg>
)

export const CrownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 16l2-9 4 4 2-6 2 6 4-4 2 9H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 16h16v1.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 013 17.5V16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

export const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 5h12M7 5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V5M5.5 5v9.5a1 1 0 001 1h5a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.5 7.5a2.5 2.5 0 114.5 1.5c0 1-1.5 1.5-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
  </svg>
)

export const PhoneCallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 2.5h3l1.5 4-2 1.5a9 9 0 004.5 4.5L11.5 11l4 1.5v3c0 .6-.4 1-1 1A14.5 14.5 0 012 3.5c0-.6.4-1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)
