/* =============================================================================
   The shell's own chrome, in both languages.

   Menna's content files carry every fact; these are the page's labels — chapter
   kickers, block headings, the statement footer. They live here rather than in the
   content files so the generated content stays a record of the repository survey.
   ========================================================================== */
import type { Language } from '@/content/types';

export interface Strings {
  issue: string;
  edition: string;
  where: string;
  est: string;
  navHome: string;
  navWhoami: string;
  navWork: string;
  navExperience: string;
  navContact: string;
  cv: string;
  ask: string;
  whoIAm: string;
  whoamiEyebrow: string;
  whoamiTitle: readonly [string, string];
  whoamiKicker: string;
  facetArchK: string;
  facetArchV: string;
  facetProofK: string;
  facetProofV: string;
  facetLangK: string;
  facetLangV: string;
  workEyebrow: string;
  workTitle: readonly [string, string];
  xpEyebrow: string;
  xpTitle: readonly [string, string];
  numbers: string;
  wins: string;
  stack: string;
  dScope: string;
  dArch: string;
  dChal: string;
  dQuality: string;
  dDetail: string;
  items: (n: number) => string;
  sLayers: string;
  sHighlights: string;
  sStack: string;
  sSteps: string;
  sDecisions: string;
  sChallenges: string;
  sScope: string;
  sPoints: string;
  sSkills: string;
  sFiles: string;
  sTests: string;
  freelance: string;
  tag_team: string;
  tag_mock: string;
  tag_planned: string;
  tag_partial: string;
  dropLine: string;
  socials: string;
  copy: string;
  copied: string;
  statement: readonly [string, string, string];
  inChapter: string;
  backTop: string;
  backToWork: string;
  caseNotFound: string;
  caseNotFoundBody: string;
  readCase: string;
  menu: string;
  theme: string;
  skipToContent: string;
  problem: string;
  fix: string;
  tests: string;
  origin: string;
}

const EN: Strings = {
  issue: 'Issue No. 01',
  edition: 'Portfolio Edition',
  where: 'Egypt · Remote',
  est: 'Flutter · Arabic & English',
  navHome: 'Home',
  navWhoami: 'Whoami',
  navWork: 'Work',
  navExperience: 'Experience',
  navContact: 'Contact',
  cv: 'CV',
  ask: 'Write to me',
  whoIAm: 'who I am',
  whoamiEyebrow: '$ ./whoami.dart',
  whoamiTitle: ['WHO IS', 'this engineer?'],
  whoamiKicker: 'straight from the about page',
  facetArchK: 'How I build',
  facetArchV: 'Clean Architecture with BLoC',
  facetProofK: 'How I prove it',
  facetProofV: 'The test that pins the fix down',
  facetLangK: 'How I ship',
  facetLangV: 'Arabic and English, RTL-first',
  // (the display face carries no apostrophe, so chapter titles are written without one)
  workEyebrow: 'Chapter 02',
  workTitle: ['WHAT I HAVE', 'built'],
  xpEyebrow: 'Chapter 03',
  xpTitle: ['WHERE I HAVE', 'worked'],
  numbers: 'By the numbers',
  wins: 'Key wins',
  stack: 'Stack',
  dScope: 'Scope',
  dArch: 'Architecture',
  dChal: 'Challenges',
  dQuality: 'Quality & limits',
  dDetail: 'What I did',
  items: (n) => `${n} item${n === 1 ? '' : 's'}`,
  sLayers: 'layers',
  sHighlights: 'highlights',
  sStack: 'stack',
  sSteps: 'flow steps',
  sDecisions: 'decisions',
  sChallenges: 'challenges',
  sScope: 'scope groups',
  sPoints: 'points',
  sSkills: 'skills',
  sFiles: 'files',
  sTests: 'tests',
  freelance: 'Freelance · delivered',
  tag_team: 'Team',
  tag_mock: 'Mock data',
  tag_planned: 'Planned',
  tag_partial: 'Partial',
  dropLine: 'drop me a line',
  socials: 'find me on the socials',
  copy: 'Copy email',
  copied: 'Copied',
  statement: [
    'Turning requirements into architecture,',
    'edge cases into tests,',
    'and apps into products.',
  ],
  inChapter: 'In this chapter',
  backTop: 'Back to top',
  backToWork: 'Back to the work',
  caseNotFound: 'No such case study',
  caseNotFoundBody: 'That link does not match any application in the portfolio.',
  readCase: 'Read the case study',
  menu: 'Menu',
  theme: 'Theme',
  skipToContent: 'Skip to content',
  problem: 'Problem',
  fix: 'Fix',
  tests: 'Tests',
  origin: 'Origin',
};

const AR: Strings = {
  issue: 'العدد الأول',
  edition: 'إصدار البورتفوليو',
  where: 'مصر · عن بُعد',
  est: 'Flutter · عربي وإنجليزي',
  navHome: 'البداية',
  navWhoami: 'من أنا',
  navWork: 'الأعمال',
  navExperience: 'الخبرة',
  navContact: 'تواصل',
  cv: 'السيرة الذاتية',
  ask: 'اكتب لي',
  whoIAm: 'من أنا',
  whoamiEyebrow: '$ ./whoami.dart',
  whoamiTitle: ['من هي', 'هذه المهندسة؟'],
  whoamiKicker: 'كما في صفحة نبذة عني',
  facetArchK: 'كيف أبني',
  facetArchV: 'Clean Architecture مع BLoC',
  facetProofK: 'كيف أتحقق',
  facetProofV: 'الاختبار الذي يثبت صحة الإصلاح',
  facetLangK: 'كيف أُسلِّم',
  facetLangV: 'بالعربية والإنجليزية، وRTL أولًا',
  workEyebrow: 'الفصل 02',
  workTitle: ['ما الذي', 'بنيته'],
  xpEyebrow: 'الفصل 03',
  xpTitle: ['أين', 'عملت'],
  numbers: 'بالأرقام',
  wins: 'أبرز النقاط',
  stack: 'التقنيات',
  dScope: 'النطاق',
  dArch: 'البنية',
  dChal: 'التحديات',
  dQuality: 'الجودة والحدود',
  dDetail: 'ما قمت به',
  items: (n) => `${n} عنصر`,
  sLayers: 'طبقات',
  sHighlights: 'نقاط',
  sStack: 'تقنية',
  sSteps: 'خطوات',
  sDecisions: 'قرارات',
  sChallenges: 'تحديات',
  sScope: 'مجموعات',
  sPoints: 'نقاط',
  sSkills: 'مهارات',
  sFiles: 'ملفات',
  sTests: 'اختبارات',
  freelance: 'عمل حر · مُسلَّم',
  tag_team: 'عمل الفريق',
  tag_mock: 'بيانات تجريبية',
  tag_planned: 'مخطَّط',
  tag_partial: 'جزئي',
  dropLine: 'راسلني',
  socials: 'تابعني',
  copy: 'نسخ البريد',
  copied: 'تم النسخ',
  statement: ['أحوّل المتطلبات إلى بنية،', 'والحالات الحرجة إلى اختبارات،', 'والتطبيقات إلى منتجات.'],
  inChapter: 'في هذا الفصل',
  backTop: 'إلى الأعلى',
  backToWork: 'العودة إلى الأعمال',
  caseNotFound: 'لا توجد دراسة حالة بهذا الاسم',
  caseNotFoundBody: 'هذا الرابط لا يطابق أي تطبيق في البورتفوليو.',
  readCase: 'اقرأ دراسة الحالة',
  menu: 'القائمة',
  theme: 'المظهر',
  skipToContent: 'انتقل إلى المحتوى',
  problem: 'المشكلة',
  fix: 'الحل',
  tests: 'الاختبارات',
  origin: 'الأصل',
};

export const STRINGS: Readonly<Record<Language, Strings>> = { en: EN, ar: AR };

/** Phrases lifted for emphasis in the Who am I narrative. They are exact substrings of
 *  her own sentences — the wording is never altered, only marked. */
export const WHOAMI_MARKS: Readonly<Record<Language, readonly string[]>> = {
  en: [
    'Computer Science and Artificial Intelligence',
    'ranked 7th in mobile development',
    'a commercial ERP',
    'where state lives',
    'making failures predictable',
    'the test that proves a fix',
    'explaining technical decisions',
  ],
  ar: [
    'علوم الحاسب والذكاء الاصطناعي',
    'المركز السابع في تطوير تطبيقات الموبايل',
    'نظام ERP تجاري',
    'تحديد مكان الحالة',
    'جعل الأخطاء متوقعة',
    'كتابة الاختبار الذي يثبت صحة الإصلاح',
    'شرح القرارات التقنية',
  ],
};
