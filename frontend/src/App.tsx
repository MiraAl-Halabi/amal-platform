import React, { useState, useEffect } from 'react';
import './style.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, 
  Search, 
  Globe, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Sparkles, 
  Send,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
}

interface Opportunity {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  type: string;
  arrangement: string;
  location: string;
  experienceLevel: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  requirements: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  organization?: Organization;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'JobSeeker' | 'Recruiter' | 'Admin';
  phone?: string;
  profile?: any;
  organization?: any;
}

export function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'browse' | 'dashboard' | 'applications'>('browse');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle Language
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  // Fetch Opportunities
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/opportunities?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Switch demo test user
  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setStatusMessage({ type: 'success', text: isRTL ? `تم تسجيل الدخول: ${user.fullName}` : `Signed in: ${user.fullName}` });
        if (user.role === 'JobSeeker') {
          fetchUserApplications(user.id);
        } else if (user.role === 'Admin') {
          fetchAdminMetrics();
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to API' });
    }
  };

  const fetchUserApplications = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/applications/seeker/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserApplications(data);
        setAppliedIds(data.map((a: any) => a.opportunityId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch('/api/v1/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setAdminMetrics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (oppId: string) => {
    if (!currentUser) {
      handleQuickLogin('ahmed.gaza@example.com', 'seeker123');
      return;
    }
    try {
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: oppId,
          applicantId: currentUser.id,
          coverLetter: coverLetter || "I am enthusiastic to bring my experience and dedicated work ethic to this role."
        })
      });
      if (res.ok) {
        setAppliedIds(prev => [...prev, oppId]);
        setStatusMessage({ type: 'success', text: isRTL ? 'تم إرسال طلب التوظيف بنجاح!' : 'Application submitted successfully!' });
        setSelectedOpportunity(null);
        setCoverLetter('');
        fetchUserApplications(currentUser.id);
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.message || 'Error submitting application' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to submit' });
    }
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    fetchOpportunities();
    handleQuickLogin('ahmed.gaza@example.com', 'seeker123');
  }, []);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${isRTL ? 'font-sans' : ''}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-950 to-indigo-950 text-white text-xs py-2 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-center sm:text-start">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:inline" />
            <span className="leading-tight">
              {isRTL 
                ? 'منصة أمل: بيئة توظيف مباشرة ومجانية لربط كفاءات قطاع غزة بسوق العمل العالمي.' 
                : 'AMAL: Direct free employment connecting Gaza talent globally.'}
            </span>
          </div>
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition px-2.5 py-1 rounded text-xs text-white shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isRTL ? 'English (LTR)' : 'العربية (RTL)'}</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm">
              أمل
            </div>
            <div>
              <div className="font-bold text-lg sm:text-xl text-blue-950 tracking-tight flex items-center gap-1.5">
                AMAL <span className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full font-medium">Live</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {isRTL ? 'فرصتك لتبدأ من جديد' : 'Gaza Talent Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'browse' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isRTL ? 'تصفح الفرص' : 'Browse Opportunities'}
            </button>
            <button 
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'applications' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isRTL ? 'طلباتي ومتابعة التوظيف' : 'My Applications'}
            </button>
            {currentUser?.role === 'Admin' && (
              <button 
                onClick={() => { setActiveTab('dashboard'); fetchAdminMetrics(); }}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'dashboard' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {isRTL ? 'لوحة الإشراف (Admin)' : 'Admin Dashboard'}
              </button>
            )}
          </nav>

          {/* Desktop Quick Role Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-slate-500 px-1 font-semibold">{isRTL ? 'المستخدم:' : 'User:'}</span>
            <button 
              onClick={() => handleQuickLogin('ahmed.gaza@example.com', 'seeker123')}
              className={`px-2 py-1 rounded transition ${currentUser?.email === 'ahmed.gaza@example.com' ? 'bg-white shadow-xs font-bold text-blue-900' : 'text-slate-600'}`}
            >
              {isRTL ? 'باحث (أحمد)' : 'Seeker'}
            </button>
            <button 
              onClick={() => handleQuickLogin('recruiter@skylinedigital.example', 'recruiter123')}
              className={`px-2 py-1 rounded transition ${currentUser?.email === 'recruiter@skylinedigital.example' ? 'bg-white shadow-xs font-bold text-blue-900' : 'text-slate-600'}`}
            >
              {isRTL ? 'صاحب عمل' : 'Recruiter'}
            </button>
            <button 
              onClick={() => handleQuickLogin('admin@amal.ps', 'admin123')}
              className={`px-2 py-1 rounded transition ${currentUser?.email === 'admin@amal.ps' ? 'bg-white shadow-xs font-bold text-blue-900' : 'text-slate-600'}`}
            >
              {isRTL ? 'مدير' : 'Admin'}
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 shadow-lg">
            <div className="flex flex-col gap-1 text-sm font-medium">
              <button 
                onClick={() => { setActiveTab('browse'); setMobileMenuOpen(false); }}
                className={`text-start px-3 py-2 rounded-lg ${activeTab === 'browse' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600'}`}
              >
                {isRTL ? 'تصفح الفرص' : 'Browse Opportunities'}
              </button>
              <button 
                onClick={() => { setActiveTab('applications'); setMobileMenuOpen(false); }}
                className={`text-start px-3 py-2 rounded-lg ${activeTab === 'applications' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600'}`}
              >
                {isRTL ? 'طلباتي ومتابعة التوظيف' : 'My Applications'}
              </button>
              {currentUser?.role === 'Admin' && (
                <button 
                  onClick={() => { setActiveTab('dashboard'); fetchAdminMetrics(); setMobileMenuOpen(false); }}
                  className={`text-start px-3 py-2 rounded-lg ${activeTab === 'dashboard' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600'}`}
                >
                  {isRTL ? 'لوحة الإشراف (Admin)' : 'Admin Dashboard'}
                </button>
              )}
            </div>

            {/* Mobile User Role Selector */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-semibold mb-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تبديل الحساب التجريبي:' : 'Switch Demo Account:'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button 
                  onClick={() => { handleQuickLogin('ahmed.gaza@example.com', 'seeker123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-lg border text-center transition ${currentUser?.email === 'ahmed.gaza@example.com' ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {isRTL ? 'باحث (أحمد)' : 'Seeker'}
                </button>
                <button 
                  onClick={() => { handleQuickLogin('recruiter@skylinedigital.example', 'recruiter123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-lg border text-center transition ${currentUser?.email === 'recruiter@skylinedigital.example' ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {isRTL ? 'صاحب عمل' : 'Recruiter'}
                </button>
                <button 
                  onClick={() => { handleQuickLogin('admin@amal.ps', 'admin123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-lg border text-center transition ${currentUser?.email === 'admin@amal.ps' ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {isRTL ? 'مدير' : 'Admin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Notification Toast */}
      {statusMessage && (
        <div className={`max-w-xl mx-auto m-3 sm:mt-4 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between shadow-xs ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100 font-bold px-2">×</button>
        </div>
      )}

      {/* Main Content Areas */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {activeTab === 'browse' && (
          <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 mb-6 sm:mb-8 shadow-md">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRTL ? 'المنصة الوطنية لفرص الكفاءات الفلسطينية' : 'Global Opportunities for Gaza Professionals'}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 leading-tight">
                  {isRTL ? 'كل موهبة تستحق فرصة.' : 'Every Talent Deserves an Opportunity.'}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-5 sm:mb-8 leading-relaxed">
                  {isRTL 
                    ? 'منصة توظيف لربط مبرمجي ومصممي ومحترفي غزة بالفرص العالمية عن بُعد.'
                    : 'A free employment platform connecting talent in Gaza with remote global careers.'}
                </p>

                {/* Search Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2 shadow-lg text-slate-800">
                  <div className="flex items-center gap-2 px-3 flex-1 w-full">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder={isRTL ? "ابحث عن مسمى أو مهارة (React, .NET)..." : "Search title or skill (e.g. React, .NET)..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities()}
                      className="w-full text-xs sm:text-sm py-1.5 sm:py-2 bg-transparent focus:outline-hidden"
                    />
                  </div>
                  <button 
                    onClick={fetchOpportunities}
                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition shadow-sm"
                  >
                    {isRTL ? 'بحث' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Opportunities Feed Header & Category Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isRTL ? 'أحدث الفرص المعلنة' : 'Verified Available Opportunities'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {opportunities.length} {isRTL ? 'فرص متوفرة' : 'opportunities loaded'}
                </p>
              </div>

              {/* Category Pills - Smooth horizontal scrolling on mobile */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 text-xs font-medium no-scrollbar">
                {['All', 'Software Engineering', 'Design & Creative', 'Medicine & Healthcare'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setTimeout(fetchOpportunities, 50); }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg border transition ${selectedCategory === cat ? 'bg-blue-900 text-white border-blue-900 font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {cat === 'All' ? (isRTL ? 'الكل' : 'All') : cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-900" />
                <span className="text-xs sm:text-sm">{isRTL ? 'جارٍ تحميل الفرص...' : 'Loading opportunities...'}</span>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200">
                <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1">{isRTL ? 'لا توجد فرص مطابقة' : 'No opportunities found'}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{isRTL ? 'جرّب البحث بكلمات دلالية مختلفة' : 'Try searching for another keyword or category'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {opportunities.map(opp => (
                  <div 
                    key={opp.id} 
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-100">
                          {opp.category}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {opp.arrangement}
                        </span>
                      </div>

                      <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-1 leading-snug">
                        {isRTL ? (opp.titleAr || opp.title) : opp.title}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-500 mb-2.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{opp.organization?.name}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{opp.location}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {isRTL ? (opp.descriptionAr || opp.description) : opp.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                        <span>${opp.minSalary} - ${opp.maxSalary}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/{opp.currency}</span>
                      </div>

                      <button
                        onClick={() => setSelectedOpportunity(opp)}
                        disabled={appliedIds.includes(opp.id)}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          appliedIds.includes(opp.id)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                        }`}
                      >
                        {appliedIds.includes(opp.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'تم التقديم' : 'Applied'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'تقديم فوري' : 'Quick Apply'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications & Dual Confirmation Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-900 shrink-0" />
              <span>{isRTL ? 'طلبات التوظيف ومسار تأكيد العمل المتبادل' : 'My Applications & Employment Confirmation'}</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              {isRTL 
                ? 'وفق متطلبات أمل: يتم اعتماد التوظيف رسمياً فقط بعد التأكيد الثنائي من قبل الباحث وصاحب العمل.'
                : 'Employment is formally confirmed only when both Recruiter & Candidate verify initiation.'}
            </p>

            {userApplications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs sm:text-sm">{isRTL ? 'لم تقدم أي طلبات بعد.' : 'No applications submitted yet.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userApplications.map(app => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{app.opportunity?.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <span>{app.opportunity?.organization?.name}</span> • <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-lg border border-slate-100">
                        "{app.coverLetter}"
                      </p>
                    </div>

                    {/* Dual Confirmation Status Widget */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs shrink-0 flex flex-col gap-1.5 w-full md:w-64">
                      <div className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>{isRTL ? 'تأكيد بدء العمل:' : 'Employment Verified:'}</span>
                        {app.employmentConfirmedAt ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isRTL ? 'معتمد رسمي' : 'Verified'}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">{isRTL ? 'قيد الانتظار' : 'Pending'}</span>
                        )}
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{isRTL ? 'تأكيد المؤسسة:' : 'Recruiter:'}</span>
                        <span>{app.recruiterConfirmedEmployment ? '✅' : '⏳'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{isRTL ? 'تأكيد الباحث:' : 'Candidate:'}</span>
                        <span>{app.candidateConfirmedEmployment ? '✅' : '⏳'}</span>
                      </div>

                      {!app.candidateConfirmedEmployment && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/v1/applications/${app.id}/confirm-employment`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ role: 'JobSeeker', confirmed: true })
                            });
                            fetchUserApplications(currentUser!.id);
                            setStatusMessage({ type: 'success', text: isRTL ? 'تم تأكيد بدء عملك!' : 'Employment verified by candidate!' });
                          }}
                          className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                        >
                          {isRTL ? 'أؤكد بدء العمل رسمياً' : 'Confirm I Started Working'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard */}
        {activeTab === 'dashboard' && currentUser?.role === 'Admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {isRTL ? 'مؤشرات منصة أمل الإدارية' : 'Private AMAL Operational Metrics'}
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                {isRTL 
                  ? 'هذه البيانات سرية وخاصة بإدارة المنصة لمتابعة نمو التوظيف والفرص في غزة.' 
                  : 'Private system metrics reserved for platform administrators.'}
              </p>

              {adminMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{isRTL ? 'الباحثون المسجلون' : 'Seekers'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-1">{adminMetrics.totalSeekers}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{isRTL ? 'أصحاب العمل' : 'Recruiters'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-1">{adminMetrics.totalRecruiters}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{isRTL ? 'إجمالي الفرص' : 'Opportunities'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-1">{adminMetrics.totalOpportunities}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{isRTL ? 'طلبات التوظيف' : 'Applications'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-1">{adminMetrics.totalApplications}</div>
                  </div>
                  <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-xl border border-emerald-200">
                    <span className="text-[11px] sm:text-xs text-emerald-800 font-semibold">{isRTL ? 'توظيف معتمد ثنائياً' : 'Dual Confirmed'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">{adminMetrics.confirmedEmployments}</div>
                  </div>
                  <div className="bg-amber-50 p-3.5 sm:p-4 rounded-xl border border-amber-200">
                    <span className="text-[11px] sm:text-xs text-amber-800 font-semibold">{isRTL ? 'بانتظار الموافقة' : 'Pending Approvals'}</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1">{adminMetrics.pendingOpportunities}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Application Modal (Fully responsive on mobile) */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                  {selectedOpportunity.category}
                </span>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-1 leading-snug">
                  {isRTL ? (selectedOpportunity.titleAr || selectedOpportunity.title) : selectedOpportunity.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedOpportunity.organization?.name} • ${selectedOpportunity.minSalary}-${selectedOpportunity.maxSalary} USD</p>
              </div>
              <button 
                onClick={() => setSelectedOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-2xl p-1 leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'رسالة التقديم والملاحظات (Cover Letter):' : 'Cover Letter / Introduction:'}
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={isRTL ? "عرّف بنفسك ومهاراتك وكيف ستساهم في هذه الفرصة من غزة..." : "Introduce yourself and explain your suitability for this opportunity..."}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-900 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleApply(selectedOpportunity.id)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm"
              >
                {isRTL ? 'تأكيد التقديم الفوري' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
