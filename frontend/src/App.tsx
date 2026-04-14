import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Nav from '@/components/Nav'
import Sidebar from '@/components/Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useMemberStore } from '@/stores/memberStore'
import { useBillingStore } from '@/stores/billingStore'
import { PLAN_REQUIRED_EVENT } from '@/api/client'
import LandingPage from '@/features/landing/LandingPage'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import ReportsPage from '@/features/reports/ReportsPage'
import TrendsPage from '@/features/trends/TrendsPage'
import CommunityPage from '@/features/community/CommunityPage'
import PostDetailPage from '@/features/community/PostDetailPage'
import ChatPage from '@/features/chat/ChatPage'
import ScanPage from '@/features/scan/ScanPage'
import SettingsPage from '@/features/settings/SettingsPage'
import HelpPage from '@/features/settings/HelpPage'
import BillingCallbackPage from '@/features/billing/BillingCallbackPage'
import PaymentPrivacyPolicy from '@/features/billing/PaymentPrivacyPolicy'
import ServiceAgreement from '@/features/billing/ServiceAgreement'
import AutoRenewalAgreement from '@/features/billing/AutoRenewalAgreement'
import PricingModal from '@/features/billing/PricingModal'
import PricingPage from '@/features/billing/PricingPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const publicPaths = new Set(['/', '/login'])
const standalonePaths = new Set(['/billing/callback'])

function AppLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )
  const location = useLocation()
  const isApp = !publicPaths.has(location.pathname) && !standalonePaths.has(location.pathname)
  const isStandalone = standalonePaths.has(location.pathname)

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
  }
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingContext, setPricingContext] = useState<string | undefined>()

  const { isAuthenticated, user, fetchUser } = useAuthStore()
  const { fetchMembers } = useMemberStore()
  const { fetchStatus: fetchBillingStatus } = useBillingStore()

  // Hydrate user data on mount when token exists but user is null
  useEffect(() => {
    if (isAuthenticated && !user) {
      void fetchUser()
    }
  }, [isAuthenticated, user, fetchUser])

  // Fetch members + billing status when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      void fetchMembers()
      void fetchBillingStatus()
    }
  }, [isAuthenticated, fetchMembers, fetchBillingStatus])

  // Listen for PLAN_REQUIRED events from API interceptor
  useEffect(() => {
    const handler = () => {
      setPricingContext(undefined)
      setPricingOpen(true)
    }
    window.addEventListener(PLAN_REQUIRED_EVENT, handler)
    return () => window.removeEventListener(PLAN_REQUIRED_EVENT, handler)
  }, [])

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white font-[family-name:var(--font-outfit)]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="relative z-10">
        {isStandalone ? (
          <div className="min-h-screen flex items-center justify-center">
            <Routes>
              <Route path="/billing/callback" element={<BillingCallbackPage />} />
            </Routes>
          </div>
        ) : (
          <>
            <Nav scrolled={scrolled} />
            <div className="pt-16">
              {isApp ? (
                <div className="flex">
                  <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/trends" element={<TrendsPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/community/:postId" element={<PostDetailPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/scan" element={<ScanPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/membership" element={<PricingPage />} />
                    <Route path="/billing/privacy-policy" element={<PaymentPrivacyPolicy />} />
                    <Route path="/billing/service-agreement" element={<ServiceAgreement />} />
                    <Route path="/billing/auto-renewal-agreement" element={<AutoRenewalAgreement />} />
                  </Routes>
                </div>
              ) : (
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Routes>
              )}
            </div>
          </>
        )}
      </div>

      {/* Global PricingModal — triggered by PLAN_REQUIRED events */}
      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        context={pricingContext}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout />
    </BrowserRouter>
  )
}
