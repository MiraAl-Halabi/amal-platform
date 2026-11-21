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
  UserCheck, 
  Check, 
  MessageSquare, 
  Users,
  ChevronRight,
  Filter,
  CheckCircle,
  Eye,
  ArrowRight,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  PlusCircle,
  XCircle,
  Phone,
  Mail,
  Plus
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

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: 'JobSeeker' | 'Recruiter' | 'Admin';
  phone?: string;
  profile?: any;
  organization?: Organization;
}

interface CandidateApplication {
  id: string;
  opportunityId: string;
  applicantId: string;
  coverLetter: string;
  status: 'Submitted' | 'UnderReview' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected';
  recruiterNotes?: string;
  submittedAt: string;
  recruiterConfirmedEmployment: boolean;
  candidateConfirmedEmployment: boolean;
  employmentConfirmedAt?: string;
  opportunity?: Opportunity;
  applicant?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    profile?: {
      bio?: string;
      skills?: string;
      yearsOfExperience?: number;
      education?: string;
      residenceCity?: string;
      isDisplaced?: boolean;
    }
  };
}

// 5 Visual Stages of the Recruiter Pipeline
const PIPELINE_COLUMNS = [
  { id: 'Submitted', labelAr: 'طلبات جديدة', labelEn: 'New Applied', color: 'slate', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'UnderReview', labelAr: 'قيد المراجعة والتقييم', labelEn: 'Under Review', color: 'amber', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'Shortlisted', labelAr: 'قائمة المرشحين المؤهلين', labelEn: 'Shortlisted', color: 'blue', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'Interview', labelAr: 'مرحلة المقابلة', labelEn: 'Interview Scheduled', color: 'purple', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'Accepted', labelAr: 'تم القبول والتوظيف', labelEn: 'Hired & Accepted', color: 'emerald', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

export function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'browse' | 'dashboard' | 'applications' | 'recruiter-pipeline'>('browse');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [userApplications, setUserApplications] = useState<CandidateApplication[]>([]);
  const [recruiterApplications, setRecruiterApplications] = useState<CandidateApplication[]>([]);
  const [selectedApplicantModal, setSelectedApplicantModal] = useState<CandidateApplication | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New Job Creation Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobFormSubmitting, setJobFormSubmitting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    titleAr: '',
    category: 'Software Engineering',
    type: 'Remote',
    arrangement: 'Remote',
    location: 'Remote (Gaza / Global)',
    experienceLevel: 'Mid-Level',
    minSalary: 1500,
    maxSalary: 2500,
    currency: 'USD',
    description: '',
    descriptionAr: '',
    requirements: ''
  });

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
        setStatusMessage({ 
          type: 'success', 
          text: isRTL ? `تم تسجيل الدخول: ${user.fullName}` : `Signed in: ${user.fullName}` 
        });

        if (user.role === 'JobSeeker') {
          fetchUserApplications(user.id);
          setActiveTab('browse');
        } else if (user.role === 'Recruiter') {
          const orgId = user.organization?.id || '11111111-1111-1111-1111-111111111111';
          fetchRecruiterApplications(orgId);
          setActiveTab('recruiter-pipeline');
        } else if (user.role === 'Admin') {
          fetchAdminMetrics();
          setActiveTab('dashboard');
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

  const fetchRecruiterApplications = async (orgId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/applications/recruiter/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setRecruiterApplications(data);
      }
    } catch (e) {
      console.error("Error fetching recruiter applications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: isRTL ? `تم نقل المرشح بنجاح إلى: ${newStatus}` : `Candidate moved to: ${newStatus}` 
        });
        const orgId = currentUser?.organization?.id || '11111111-1111-1111-1111-111111111111';
        fetchRecruiterApplications(orgId);
        if (selectedApplicantModal && selectedApplicantModal.id === appId) {
          setSelectedApplicantModal(prev => prev ? { ...prev, status: newStatus as any } : null);
        }
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error updating candidate' });
    }
  };

  const handleRecruiterConfirmEmployment = async (appId: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${appId}/confirm-employment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Recruiter', confirmed: true })
      });
      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: isRTL ? 'تم تأكيد بدء التوظيف رسمياً من طرف المؤسسة!' : 'Hire verified successfully!' 
        });
        const orgId = currentUser?.organization?.id || '11111111-1111-1111-1111-111111111111';
        fetchRecruiterApplications(orgId);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Confirmation error' });
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim()) {
      setStatusMessage({ type: 'error', text: isRTL ? 'يرجى إدخال عنوان الوظيفة' : 'Please enter job title' });
      return;
    }

    try {
      setJobFormSubmitting(true);
      const orgId = currentUser?.organization?.id || '11111111-1111-1111-1111-111111111111';
      const payload = {
        organizationId: orgId,
        title: jobForm.title,
        titleAr: jobForm.titleAr || jobForm.title,
        description: jobForm.description || "Exciting remote opportunity connecting global work with talented Gaza professionals.",
        descriptionAr: jobForm.descriptionAr || "فرصة عمل متميزة عن بعد لكفاءات ومحترفي قطاع غزة.",
        category: jobForm.category,
        type: jobForm.type,
        arrangement: jobForm.arrangement,
        location: jobForm.location,
        experienceLevel: jobForm.experienceLevel,
        minSalary: Number(jobForm.minSalary),
        maxSalary: Number(jobForm.maxSalary),
        currency: jobForm.currency,
        requirements: jobForm.requirements || "- Strong problem solving skills\n- Excellent remote communication"
      };

      const res = await fetch('/api/v1/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: isRTL ? 'تم نشر الوظيفة بنجاح وأصبحت متاحة للتقديم!' : 'Job opportunity posted and published live!' 
        });
        setShowJobModal(false);
        // Reset form
        setJobForm({
          title: '',
          titleAr: '',
          category: 'Software Engineering',
          type: 'Remote',
          arrangement: 'Remote',
          location: 'Remote (Gaza / Global)',
          experienceLevel: 'Mid-Level',
          minSalary: 1500,
          maxSalary: 2500,
          currency: 'USD',
          description: '',
          descriptionAr: '',
          requirements: ''
        });
        fetchOpportunities();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to post job opportunity' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to API server' });
    } finally {
      setJobFormSubmitting(false);
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
          coverLetter: coverLetter || "أرغب بشدة في المساهمة بخبرتي ومهاراتي في هذا المنصب من غزة."
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
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">
              {isRTL 
                ? 'منصة أمل: منصة توظيف حرة ومباشرة لدعم كفاءات ومحترفي قطاع غزة وربطهم بسوق العمل العالمي.' 
                : 'AMAL: Free direct employment platform connecting Gaza talent to global remote opportunities.'}
            </span>
          </div>
          <button 
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{isRTL ? 'English (LTR)' : 'العربية (RTL)'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('browse')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
              أمل
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-950">AMAL</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">
                {isRTL ? 'منصة العمل الحر والتوظيف' : 'Gaza Career Gateway'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'browse' 
                  ? 'bg-white text-blue-900 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {isRTL ? 'تصفح الفرص' : 'Explore Jobs'}
            </button>

            {currentUser?.role === 'JobSeeker' && (
              <button 
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'applications' 
                    ? 'bg-white text-blue-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {isRTL ? 'طلباتي ومتابعة التوظيف' : 'My Applications'}
              </button>
            )}

            {currentUser?.role === 'Recruiter' && (
              <button 
                onClick={() => {
                  setActiveTab('recruiter-pipeline');
                  const orgId = currentUser.organization?.id || '11111111-1111-1111-1111-111111111111';
                  fetchRecruiterApplications(orgId);
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === 'recruiter-pipeline' 
                    ? 'bg-white text-blue-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>{isRTL ? 'لوحة إدارة التوظيف (Pipeline)' : 'Hiring Pipeline'}</span>
              </button>
            )}

            {currentUser?.role === 'Admin' && (
              <button 
                onClick={() => { setActiveTab('dashboard'); fetchAdminMetrics(); }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-blue-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {isRTL ? 'لوحة الإشراف' : 'Admin Analytics'}
              </button>
            )}
          </nav>

          {/* Recruiter Action & Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Post Job Button (Directly Visible for Recruiters) */}
            {currentUser?.role === 'Recruiter' && (
              <button
                onClick={() => setShowJobModal(true)}
                className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRTL ? 'إعلان عن فرصة جديدة' : 'Post New Job'}</span>
              </button>
            )}

            {/* Quick Role Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 px-2">{isRTL ? 'الحساب التجريبي:' : 'Demo User:'}</span>
              <button 
                onClick={() => handleQuickLogin('ahmed.gaza@example.com', 'seeker123')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.email === 'ahmed.gaza@example.com' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {isRTL ? 'باحث (أحمد)' : 'Seeker'}
              </button>
              <button 
                onClick={() => handleQuickLogin('recruiter@skylinedigital.example', 'recruiter123')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.email === 'recruiter@skylinedigital.example' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {isRTL ? 'صاحب عمل (طارق)' : 'Recruiter'}
              </button>
              <button 
                onClick={() => handleQuickLogin('admin@amal.ps', 'admin123')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.email === 'admin@amal.ps' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {isRTL ? 'إدارة' : 'Admin'}
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-xl">
            {currentUser?.role === 'Recruiter' && (
              <button
                onClick={() => { setShowJobModal(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs mb-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRTL ? 'إعلان عن فرصة جديدة' : 'Post New Job'}</span>
              </button>
            )}

            <div className="flex flex-col gap-1.5 text-sm font-semibold">
              <button 
                onClick={() => { setActiveTab('browse'); setMobileMenuOpen(false); }}
                className={`text-start px-3.5 py-2.5 rounded-xl transition ${activeTab === 'browse' ? 'text-blue-900 bg-blue-50 font-bold' : 'text-slate-600'}`}
              >
                {isRTL ? 'تصفح الفرص' : 'Explore Jobs'}
              </button>
              
              {currentUser?.role === 'JobSeeker' && (
                <button 
                  onClick={() => { setActiveTab('applications'); setMobileMenuOpen(false); }}
                  className={`text-start px-3.5 py-2.5 rounded-xl transition ${activeTab === 'applications' ? 'text-blue-900 bg-blue-50 font-bold' : 'text-slate-600'}`}
                >
                  {isRTL ? 'طلباتي ومتابعة التوظيف' : 'My Applications'}
                </button>
              )}

              {currentUser?.role === 'Recruiter' && (
                <button 
                  onClick={() => { 
                    setActiveTab('recruiter-pipeline'); 
                    const orgId = currentUser.organization?.id || '11111111-1111-1111-1111-111111111111';
                    fetchRecruiterApplications(orgId);
                    setMobileMenuOpen(false); 
                  }}
                  className={`text-start px-3.5 py-2.5 rounded-xl transition ${activeTab === 'recruiter-pipeline' ? 'text-blue-900 bg-blue-50 font-bold' : 'text-slate-600'}`}
                >
                  {isRTL ? 'لوحة إدارة التوظيف (Pipeline)' : 'Hiring Pipeline'}
                </button>
              )}

              {currentUser?.role === 'Admin' && (
                <button 
                  onClick={() => { setActiveTab('dashboard'); fetchAdminMetrics(); setMobileMenuOpen(false); }}
                  className={`text-start px-3.5 py-2.5 rounded-xl transition ${activeTab === 'dashboard' ? 'text-blue-900 bg-blue-50 font-bold' : 'text-slate-600'}`}
                >
                  {isRTL ? 'لوحة الإشراف' : 'Admin Analytics'}
                </button>
              )}
            </div>

            {/* Mobile Role Switcher */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'تبديل الدور التجريبي:' : 'Switch User Role:'}</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => { handleQuickLogin('ahmed.gaza@example.com', 'seeker123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-xl text-xs font-bold border transition ${currentUser?.email === 'ahmed.gaza@example.com' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {isRTL ? 'باحث (أحمد)' : 'Seeker'}
                </button>
                <button 
                  onClick={() => { handleQuickLogin('recruiter@skylinedigital.example', 'recruiter123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-xl text-xs font-bold border transition ${currentUser?.email === 'recruiter@skylinedigital.example' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {isRTL ? 'صاحب عمل' : 'Recruiter'}
                </button>
                <button 
                  onClick={() => { handleQuickLogin('admin@amal.ps', 'admin123'); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-xl text-xs font-bold border transition ${currentUser?.email === 'admin@amal.ps' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {isRTL ? 'إدارة' : 'Admin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100 font-black px-2">×</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ========================================================= */}
        {/* TAB 1: BROWSE JOBS                                        */}
        {/* ========================================================= */}
        {activeTab === 'browse' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-8 sm:p-14 shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isRTL ? 'كل موهبة تستحق فرصة كريمة' : 'Empowering Gaza Talents Globally'}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
                  {isRTL ? (
                    <>أكبر منصة لربط كفاءات <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300">غزة</span> بسوق العمل العالمي</>
                  ) : (
                    <>Connecting Global Companies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300">Gaza's Best</span> Talent</>
                  )}
                </h1>

                <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-2xl font-normal">
                  {isRTL 
                    ? 'منصة غير ربحية تفتح الأبواب للمبرمجين والمصممين والمحترفين في غزة للوصول إلى عقود عمل عن بُعد وشركات دولية موثوقة.'
                    : 'A non-profit initiative opening remote doors for engineers, designers, and specialists in Gaza to connect with vetted international employers.'}
                </p>

                {/* Search Box */}
                <div className="pt-2">
                  <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 border border-slate-100">
                    <div className="flex items-center gap-3 px-3 flex-1 w-full text-slate-700">
                      <Search className="w-5 h-5 text-slate-400 shrink-0" />
                      <input 
                        type="text" 
                        placeholder={isRTL ? "ابحث عن مسمى وظيفي أو مهارة (مثل: React, .NET, UI/UX)..." : "Search title or skill (e.g. React, .NET, UI/UX)..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities()}
                        className="w-full text-sm sm:text-base py-2 bg-transparent focus:outline-hidden font-medium placeholder:text-slate-400"
                      />
                    </div>
                    <button 
                      onClick={fetchOpportunities}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                    >
                      {isRTL ? 'بحث الآن' : 'Search Jobs'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Feed */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isRTL ? 'الفرص المتاحة والمعتمدة' : 'Verified Open Opportunities'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {opportunities.length} {isRTL ? 'وظائف وعقود عمل نشطة' : 'active jobs & remote contracts'}
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
                {['All', 'Software Engineering', 'Design & Creative', 'Medicine & Healthcare'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setTimeout(fetchOpportunities, 50); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'All' ? (isRTL ? 'جميع المجالات' : 'All Domains') : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Cards Grid */}
            {loading ? (
              <div className="text-center py-20 text-slate-400">
                <Clock className="w-9 h-9 animate-spin mx-auto mb-3 text-blue-600" />
                <span className="text-sm font-semibold">{isRTL ? 'جارٍ تحميل الفرص...' : 'Loading verified opportunities...'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {opportunities.map(opp => (
                  <div 
                    key={opp.id} 
                    className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                          {opp.category}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{opp.arrangement}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                        {isRTL ? (opp.titleAr || opp.title) : opp.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{opp.organization?.name}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{opp.location}</span>
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-5 leading-relaxed font-normal">
                        {isRTL ? (opp.descriptionAr || opp.description) : opp.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {isRTL ? 'الراتب التقديري' : 'Compensation'}
                        </span>
                        <div className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-0.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>${opp.minSalary} - ${opp.maxSalary}</span>
                          <span className="text-xs text-slate-400 font-medium">/{opp.currency}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedOpportunity(opp)}
                        disabled={appliedIds.includes(opp.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          appliedIds.includes(opp.id)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-blue-600 text-white shadow-xs'
                        }`}
                      >
                        {appliedIds.includes(opp.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{isRTL ? 'تم التقديم' : 'Applied'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'تقديم مباشر' : 'Apply Now'}</span>
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

        {/* ========================================================= */}
        {/* TAB 2: RECRUITER CLEAR VISUAL PIPELINE (KANBAN-STYLE)    */}
        {/* ========================================================= */}
        {activeTab === 'recruiter-pipeline' && (
          <div className="space-y-6">
            {/* Header with Visual Instructions & Post Job Trigger */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{currentUser?.organization?.name || 'Skyline Digital Solutions'}</span>
                    </span>
                    <button
                      onClick={() => setShowJobModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'إضافة فرصة جديدة' : '+ Post Job'}</span>
                    </button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {isRTL ? 'مسار إدارة وتوظيف المرشحين (Hiring Pipeline)' : 'Candidate Hiring Pipeline'}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                    {isRTL 
                      ? 'دليل العمل: يتم تقسيم المرشحين عبر 5 مراحل واضحة. اضغط على أي بطاقة لعرض تفاصيل المرشح الكاملة ونقله للمرحلة التالية.' 
                      : 'How it works: Candidates move across 5 clear hiring stages. Click any card to review full details and advance their status.'}
                  </p>
                </div>

                {/* Counter summary */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0">
                  <div className="text-center px-3 border-e border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 block">{isRTL ? 'إجمالي الطلبات' : 'Total'}</span>
                    <span className="text-xl font-black text-slate-900">{recruiterApplications.length}</span>
                  </div>
                  <div className="text-center px-3 border-e border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 block">{isRTL ? 'قيد الدراسة' : 'In Review'}</span>
                    <span className="text-xl font-black text-amber-600">
                      {recruiterApplications.filter(a => ['Submitted', 'UnderReview'].includes(a.status)).length}
                    </span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[11px] font-bold text-slate-400 block">{isRTL ? 'معتمد رسمي' : 'Hired'}</span>
                    <span className="text-xl font-black text-emerald-600">
                      {recruiterApplications.filter(a => a.status === 'Accepted').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Column Kanban Board Layout */}
              <div className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {PIPELINE_COLUMNS.map(col => {
                    const colApps = recruiterApplications.filter(a => a.status === col.id);

                    return (
                      <div key={col.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col min-h-[420px]">
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {isRTL ? col.labelAr : col.labelEn}
                          </span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${col.badge}`}>
                            {colApps.length}
                          </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 space-y-3">
                          {colApps.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 rounded-xl text-slate-400">
                              <span className="text-xs font-medium">
                                {isRTL ? 'لا يوجد مرشحون حالياً' : 'No candidates here'}
                              </span>
                            </div>
                          ) : (
                            colApps.map(app => (
                              <div 
                                key={app.id}
                                onClick={() => setSelectedApplicantModal(app)}
                                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                              >
                                {/* Candidate Name & Job Title */}
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {app.applicant?.fullName || 'مرشح من غزة'}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                    {app.opportunity?.title}
                                  </p>
                                </div>

                                {/* Gaza Profile Snippet */}
                                {app.applicant?.profile && (
                                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-600">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold">
                                      {app.applicant.profile.skills ? app.applicant.profile.skills.split(',')[0] : '.NET / React'}
                                    </span>
                                    {app.applicant.profile.city && (
                                      <span className="text-slate-400">📍 {app.applicant.profile.city}</span>
                                    )}
                                  </div>
                                )}

                                {/* Cover letter preview */}
                                <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  "{app.coverLetter}"
                                </p>

                                {/* Footer details */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                  <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                                  
                                  {app.employmentConfirmedAt ? (
                                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {isRTL ? 'معتمد ✅' : 'Verified'}
                                    </span>
                                  ) : (
                                    <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                                      {isRTL ? 'عرض الملف' : 'View'}
                                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: JOB SEEKER APPLICATIONS & DUAL CONFIRMATION        */}
        {/* ========================================================= */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>{isRTL ? 'طلبات التوظيف ومسار تأكيد العمل' : 'My Applications & Employment Confirmation'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
              {isRTL 
                ? 'وفق متطلبات أمل: يتم اعتماد التوظيف رسمياً فقط بعد التأكيد المتبادل من الباحث وصاحب العمل.'
                : 'Employment is officially verified once both candidate and recruiter confirm initiation.'}
            </p>

            {userApplications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold">{isRTL ? 'لم تقدم أي طلبات توظيف بعد.' : 'No applications submitted yet.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userApplications.map(app => (
                  <div key={app.id} className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-base sm:text-lg text-slate-900">{app.opportunity?.title}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        <span>{app.opportunity?.organization?.name}</span> • <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 bg-white p-3 rounded-xl border border-slate-200">
                        "{app.coverLetter}"
                      </p>
                    </div>

                    {/* Dual Confirmation Status Widget */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs shrink-0 flex flex-col gap-2 w-full md:w-72">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{isRTL ? 'حالة الاعتماد النهائي:' : 'Employment Verified:'}</span>
                        {app.employmentConfirmedAt ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {isRTL ? 'معتمد رسمي' : 'Verified'}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">{isRTL ? 'قيد الإجراء' : 'Pending'}</span>
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
                          className="mt-1 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          {isRTL ? 'أؤكد بدء العمل رسميًا' : 'Confirm I Started Working'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ADMIN ANALYTICS DASHBOARD                          */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && currentUser?.role === 'Admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {isRTL ? 'مؤشرات منصة أمل الإدارية والتشغيلية' : 'Private AMAL Operational Metrics'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
                {isRTL 
                  ? 'لوحة داخلية للإدارة لمتابعة نسب التوظيف والفرص المفتوحة لكفاءات غزة.' 
                  : 'Internal analytics for tracking employment generation and platform growth.'}
              </p>

              {adminMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isRTL ? 'الباحثون المسجلون' : 'Seekers'}</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">{adminMetrics.totalSeekers}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isRTL ? 'أصحاب العمل والشركات' : 'Employers'}</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">{adminMetrics.totalRecruiters}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isRTL ? 'إجمالي الفرص' : 'Opportunities'}</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">{adminMetrics.totalOpportunities}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isRTL ? 'طلبات التوظيف' : 'Applications'}</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">{adminMetrics.totalApplications}</div>
                  </div>
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">{isRTL ? 'توظيف معتمد ثنائياً' : 'Dual Confirmed'}</span>
                    <div className="text-3xl font-black text-emerald-700 mt-1">{adminMetrics.confirmedEmployments}</div>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                    <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{isRTL ? 'بانتظار المراجعة' : 'Pending Approvals'}</span>
                    <div className="text-3xl font-black text-amber-700 mt-1">{adminMetrics.pendingOpportunities}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* CANDIDATE DETAIL & ACTION MODAL (FOR RECRUITER)           */}
      {/* ========================================================= */}
      {selectedApplicantModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  selectedApplicantModal.status === 'Accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  selectedApplicantModal.status === 'Interview' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  selectedApplicantModal.status === 'Shortlisted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  selectedApplicantModal.status === 'UnderReview' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {isRTL ? `المرحلة الحالية: ${selectedApplicantModal.status}` : `Current Stage: ${selectedApplicantModal.status}`}
                </span>
                
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  {selectedApplicantModal.applicant?.fullName || 'أحمد المصري'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                  {isRTL ? 'متقدم لوظيفة:' : 'Applied for:'} <span className="text-blue-600">{selectedApplicantModal.opportunity?.title}</span>
                </p>
              </div>

              <button 
                onClick={() => setSelectedApplicantModal(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-2xl p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Candidate Gaza Profile Overview */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isRTL ? 'بيانات الكفاءة والسيرة الذاتية (غزة)' : 'Candidate Profile Summary (Gaza)'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">{selectedApplicantModal.applicant?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{selectedApplicantModal.applicant?.phone || '+970 59-900-0003'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{selectedApplicantModal.applicant?.profile?.city || 'مدينة غزة'} (Palestine)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{selectedApplicantModal.applicant?.profile?.education || 'بكالوريوس هندسة برمجيات'}</span>
                </div>
              </div>

              {selectedApplicantModal.applicant?.profile?.skills && (
                <div className="pt-3 border-t border-slate-200/80">
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">{isRTL ? 'المهارات التقنية:' : 'Key Skills:'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplicantModal.applicant.profile.skills.split(',').map((sk: string) => (
                      <span key={sk} className="bg-white border border-slate-200 text-blue-900 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        {sk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Full Cover Letter */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                {isRTL ? 'رسالة التقديم (Cover Letter)' : 'Candidate Motivation Letter'}
              </h4>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                "{selectedApplicantModal.coverLetter}"
              </div>
            </div>

            {/* Recruiter Action Bar: Advance Stage Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-xs font-black text-slate-700 block">
                {isRTL ? 'اتخاذ قرار ونقل المرشح إلى المرحلة التالية:' : 'Advance Candidate to Next Stage:'}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplicantModal.id, 'UnderReview')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedApplicantModal.status === 'UnderReview' 
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-black' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  🟡 {isRTL ? 'قيد الدراسة' : 'Under Review'}
                </button>

                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplicantModal.id, 'Shortlisted')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedApplicantModal.status === 'Shortlisted' 
                      ? 'bg-blue-100 border-blue-300 text-blue-900 font-black' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  🔵 {isRTL ? 'قائمة قصيرة' : 'Shortlisted'}
                </button>

                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplicantModal.id, 'Interview')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedApplicantModal.status === 'Interview' 
                      ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  🟣 {isRTL ? 'جدولة مقابلة' : 'Interview'}
                </button>

                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplicantModal.id, 'Accepted')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedApplicantModal.status === 'Accepted' 
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black' 
                      : 'bg-white hover:bg-slate-50 border-emerald-300 text-emerald-700'
                  }`}
                >
                  🟢 {isRTL ? 'قبول وتوظيف' : 'Hire & Accept'}
                </button>
              </div>

              {/* Hire Confirmation Button */}
              {selectedApplicantModal.status === 'Accepted' && !selectedApplicantModal.recruiterConfirmedEmployment && (
                <button
                  onClick={() => {
                    handleRecruiterConfirmEmployment(selectedApplicantModal.id);
                    setSelectedApplicantModal(null);
                  }}
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRTL ? 'تأكيد بدء العمل رسميًا من طرف المؤسسة (Section 19 Dual Confirmation)' : 'Verify & Sign Official Hire Initiation'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECRUITER POST NEW JOB MODAL (Feature #1)                  */}
      {/* ========================================================= */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                  {currentUser?.organization?.name || 'Skyline Digital Solutions'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  {isRTL ? 'إعلان عن فرصة عمل جديدة' : 'Create & Post Job Opportunity'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {isRTL 
                    ? 'سيتم نشر هذه الفرصة مباشرة لكفاءات ومحترفي قطاع غزة.' 
                    : 'This job will be published immediately to professionals in Gaza.'}
                </p>
              </div>

              <button 
                onClick={() => setShowJobModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-2xl p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'المسمى الوظيفي (إنجليزي) *' : 'Job Title (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'المسمى الوظيفي (عربي)' : 'Job Title (Arabic)'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مهندس واجهات أمامية متقدم"
                    value={jobForm.titleAr}
                    onChange={(e) => setJobForm({ ...jobForm, titleAr: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'المجال التخصصي' : 'Category'}
                  </label>
                  <select
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Medicine & Healthcare">Medicine & Healthcare</option>
                    <option value="Education & Translation">Education & Translation</option>
                    <option value="Marketing & Sales">Marketing & Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'طبيعة العمل' : 'Arrangement'}
                  </label>
                  <select
                    value={jobForm.arrangement}
                    onChange={(e) => setJobForm({ ...jobForm, arrangement: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="Remote">Remote (عن بُعد)</option>
                    <option value="Hybrid">Hybrid (مدمج)</option>
                    <option value="Onsite">Onsite (حضوري)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'مستوى الخبرة' : 'Experience Level'}
                  </label>
                  <select
                    value={jobForm.experienceLevel}
                    onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium bg-white"
                  >
                    <option value="Entry-Level">Entry-Level (مبتدئ)</option>
                    <option value="Mid-Level">Mid-Level (متوسط)</option>
                    <option value="Senior">Senior (متقدم)</option>
                    <option value="Lead">Lead / Director</option>
                  </select>
                </div>
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'الحد الأدنى للراتب' : 'Min Salary'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={jobForm.minSalary}
                      onChange={(e) => setJobForm({ ...jobForm, minSalary: Number(e.target.value) })}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                    />
                    <span className="absolute end-3 top-3 text-xs text-slate-400 font-bold">$ USD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'الحد الأعلى للراتب' : 'Max Salary'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={jobForm.maxSalary}
                      onChange={(e) => setJobForm({ ...jobForm, maxSalary: Number(e.target.value) })}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                    />
                    <span className="absolute end-3 top-3 text-xs text-slate-400 font-bold">$ USD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRTL ? 'نطاق الموقع الجغرافي' : 'Location Scope'}
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRTL ? 'الوصف الوظيفي والمسؤوليات (عربي أو إنجليزي)' : 'Job Description & Role Summary'}
                </label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe key responsibilities and work environment..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRTL ? 'المتطلبات والمهارات المطلوبة' : 'Skills & Requirements'}
                </label>
                <textarea
                  rows={3}
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="- 3+ years experience with React/TypeScript&#10;- Good async English communication&#10;- Gaza-based remote workflow flexibility"
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={jobFormSubmitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {jobFormSubmitting ? (isRTL ? 'جارٍ النشر...' : 'Publishing...') : (isRTL ? 'نشر الوظيفة فوراً' : 'Publish Job Live')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Quick Apply Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  {selectedOpportunity.category}
                </span>
                <h3 className="font-extrabold text-xl text-slate-900 mt-2 leading-snug">
                  {isRTL ? (selectedOpportunity.titleAr || selectedOpportunity.title) : selectedOpportunity.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{selectedOpportunity.organization?.name} • ${selectedOpportunity.minSalary}-${selectedOpportunity.maxSalary} USD</p>
              </div>
              <button 
                onClick={() => setSelectedOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-2xl p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isRTL ? 'رسالة التقديم والملاحظات (Cover Letter):' : 'Cover Letter / Introduction:'}
              </label>
              <textarea
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={isRTL ? "عرّف بنفسك ومهاراتك وكيف ستساهم في هذه الفرصة من غزة..." : "Introduce yourself and explain how you fit this opportunity from Gaza..."}
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleApply(selectedOpportunity.id)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
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
