import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: "AMAL | أمل",
      tagline: "Every Talent Deserves an Opportunity",
      subTagline: "Connecting Gaza's Talent to the World",
      arabicSlogan: "فرصتك لتبدأ من جديد",
      nav: {
        explore: "Browse Opportunities",
        organizations: "Organizations",
        login: "Sign In",
        register: "Get Started",
        dashboard: "Dashboard",
        logout: "Sign Out"
      },
      roles: {
        seeker: "Job Seeker",
        recruiter: "Recruiter",
        admin: "Administrator"
      },
      search: {
        placeholder: "Job title, keywords, or skills...",
        categoryAll: "All Categories",
        searchBtn: "Find Opportunities"
      },
      actions: {
        apply: "Quick Apply",
        applied: "Applied",
        approve: "Approve Listing",
        reject: "Reject Listing",
        shortlist: "Shortlist",
        confirmHire: "Confirm Employment"
      }
    }
  },
  ar: {
    translation: {
      appName: "أمل | AMAL",
      tagline: "كل موهبة تستحق فرصة",
      subTagline: "ربط كفاءات ومواهب غزة بالعالم",
      arabicSlogan: "فرصتك لتبدأ من جديد",
      nav: {
        explore: "تصفح الفرص",
        organizations: "المؤسسات والشركات",
        login: "تسجيل الدخول",
        register: "ابدأ الآن",
        dashboard: "لوحة التحكم",
        logout: "تسجيل الخروج"
      },
      roles: {
        seeker: "باحث عن عمل",
        recruiter: "صاحب عمل / مؤسسة",
        admin: "إدارة المنصة"
      },
      search: {
        placeholder: "المسمى الوظيفي، الكلمات الدلالية، المهارات...",
        categoryAll: "كافة المجالات والتخصصات",
        searchBtn: "بحث عن فرص"
      },
      actions: {
        apply: "تقديم سريع",
        applied: "تم التقديم",
        approve: "الموافقة على النشر",
        reject: "رفض الإعلان",
        shortlist: "إضافة للقائمة المختصرة",
        confirmHire: "تأكيد بدء العمل"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Arabic is default per AMAL specification
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
