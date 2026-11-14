/* =============================================================================
   The corrections layer.

   The generated content files describe Hen Lehen from its public repository snapshot —
   mock data, an unconnected FastAPI service, "prototype". Menna states that snapshot is
   superseded: the product was commissioned, developed end to end and delivered to the
   client on its own .NET backend.

   Snapshot-only statements are REMOVED rather than reversed. Nothing is asserted in
   their place: no .NET architecture, endpoint or integration detail is claimed anywhere,
   because none of it is verifiable from anything available here.

   Keeping this as a separate module rather than editing the JSON keeps the generated
   content files a faithful record of the repository survey, and keeps every correction
   in one reviewable place.
   ========================================================================== */
import type { Language, ScopeEntry, ScopeGroup, ScopeStatus, Status } from '@/content/types';

export const HEN_LEHEN_IDS = ['hen-lehen', 'hen-lehen-patient', 'hen-lehen-doctor'] as const;

/** The FastAPI service in the public monorepo is an earlier, separate implementation and
 *  is not the backend of the delivered product, so it is not listed under Hen Lehen. */
export const DROPPED_ENTRY_IDS: readonly string[] = ['hen-lehen-backend'];

/** Sentences that described the old public snapshot only. Removed, not rewritten. */
const DROP_EXACT = new Set<string>([
  // English
  'No backend integration: all data is an in-memory mock, and login uses hard-coded credentials.',
  'A separate FastAPI backend exists on its own branch but is not connected.',
  'Build the whole journey first, so the product idea could be judged before any backend existed.',
  'Write the locale handling by hand rather than add a code-generation step to a prototype — and record the cost: the keys are duplicated across the two apps.',
  'Build the full journey on mock data first, so the product could be judged before the backend existed — and say so plainly rather than implying a live app.',
  'Models and the mock data set',
  'مستودع نداؤه الحقيقي معلّق كتعليق',
  // Arabic
  'بناء المسار كاملًا أولًا، ليكون الحكم على فكرة المنتج ممكنًا قبل وجود أي خدمة خلفية.',
  'كتابة معالجة اللغة يدويًا بدل إضافة خطوة توليد كود إلى نموذج أولي — مع تدوين الثمن: تكرار المفاتيح بين التطبيقين.',
  'النماذج ومجموعة بيانات المحاكاة',
  'لا اتصال بخدمة خلفية: كل البيانات محاكاة في الذاكرة، وتسجيل الدخول ببيانات ثابتة في الكود.',
  'توجد خدمة خلفية بـ FastAPI على فرع مستقل لكنها غير موصولة.',
  'بناء الرحلة كاملة على بيانات محاكاة أولاً، ليُحكَم على المنتج قبل وجود الخلفية — وقول ذلك صراحةً بدل الإيحاء بتطبيق حيّ.',
]);

/** Substring repairs: each removes a snapshot qualifier from a sentence that is otherwise
 *  still true of the delivered product. */
const SUBSTITUTIONS: readonly (readonly [string, string])[] = [
  ['women-only telemedicine idea', 'women-only telemedicine platform'],
  ['Filters and sorts the mock doctor list', 'Filters and sorts the doctor list'],
  ['in a prototype that had to stay quick to change', 'in a codebase that had to stay quick to change'],
  ['The migration itself exists only on side branches, which is why this is shown as a prototype.', ''],
  ['فكرة طب عن بُعد', 'منصة طب عن بُعد'],
  ['يفلتر قائمة الطبيبات في بيانات المحاكاة', 'يفلتر قائمة الطبيبات'],
  ['في نموذج أولي يجب أن يبقى سريع التعديل', 'في كود يجب أن يبقى سريع التعديل'],
  ['أما الترحيل نفسه فموجود على فروع جانبية فقط، ولهذا يُعرض المشروع كنموذج أولي.', ''],
];

function correctString(value: string): string | null {
  if (DROP_EXACT.has(value)) return null;
  let out = value;
  for (const [from, to] of SUBSTITUTIONS) {
    if (out.includes(from)) out = out.replace(from, to);
  }
  const trimmed = out.trim();
  return trimmed === '' ? null : trimmed;
}

const isEmptyObject = (value: unknown): boolean =>
  !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;

/**
 * Deep copy with the corrections applied; anything reduced to nothing is dropped, so an
 * empty list never renders as an empty block.
 */
export function applyHenLehenCorrections<T>(value: T): T {
  if (typeof value === 'string') return correctString(value) as unknown as T;
  if (Array.isArray(value)) {
    return value
      .map((item) => applyHenLehenCorrections(item))
      .filter(
        (item) =>
          item !== null &&
          item !== '' &&
          !(Array.isArray(item) && item.length === 0) &&
          !isEmptyObject(item),
      ) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const result = applyHenLehenCorrections((value as Record<string, unknown>)[key]);
      if (result !== null) out[key] = result;
    }
    return out as unknown as T;
  }
  return value;
}

/** Menna states the delivered product ran on its own .NET backend with real data. */
export const HEN_LEHEN_STATUS: Readonly<Record<Language, Status>> = {
  en: { text: 'Delivered to the client · .NET backend', tone: 'ok' },
  ar: { text: 'سُلِّم للعميل · خدمة خلفية بـ .NET', tone: 'ok' },
};

export const CLASSIFICATION: Readonly<Record<Language, string>> = {
  en: 'Freelance project · end-to-end development · delivered to the client',
  ar: 'مشروع حر · تطوير متكامل من الألف إلى الياء · سُلِّم للعميل',
};

/** Three scope lines described the old public snapshot rather than the delivered product.
 *  Two are dropped and one loses only its snapshot qualifier. */
interface ScopeFix {
  readonly drop: readonly string[];
  readonly rewrite: Readonly<Record<string, string>>;
}

const SCOPE_FIX: Readonly<Record<string, ScopeFix>> = {
  'hen-lehen-patient': {
    drop: [
      'All doctor, review and appointment data from an in-memory mock set',
      'Real payment processing',
      'كل بيانات الطبيبات والتقييمات والمواعيد من مجموعة محاكاة في الذاكرة',
      'معالجة دفع حقيقية',
    ],
    rewrite: {
      'Chat screen over a local message list': 'Chat screen',
      'شاشة محادثة فوق قائمة رسائل محلية': 'شاشة محادثة',
    },
  },
};

const scopeText = (entry: ScopeEntry): string => (Array.isArray(entry) ? entry[0] : (entry as string));
const scopeStatus = (entry: ScopeEntry): ScopeStatus =>
  Array.isArray(entry) ? ((entry[1] ?? 'done') as ScopeStatus) : 'done';

/** Applies the per-application scope repairs and prunes groups left empty. */
export function correctScope(id: string, groups: readonly ScopeGroup[]): ScopeGroup[] {
  const fix = SCOPE_FIX[id];
  if (!fix) return [...groups];
  return groups
    .map((group) => ({
      ...group,
      items: (group.items ?? [])
        .filter((entry) => !fix.drop.includes(scopeText(entry)))
        .map<ScopeEntry>((entry) => {
          const text = scopeText(entry);
          const replacement = fix.rewrite[text];
          return replacement ? [replacement, 'done'] : [text, scopeStatus(entry)];
        }),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Tasky carries no `detail` block in the generated content files. Its scope is supplied
 * here instead, read from the repository itself: lib/screens, lib/utilities/services,
 * lib/utilities/models/task_model.dart and pubspec.yaml.
 *
 * Deliberately absent: the README lists Firebase Cloud Messaging and push-notification
 * reminders, but there is no firebase_messaging dependency and no notification code in
 * lib/, so neither is claimed here.
 */
export const SCOPE_SUPPLEMENT: Readonly<
  Record<string, Readonly<Record<Language, readonly ScopeGroup[]>>>
> = {
  tasky: {
    en: [
      {
        title: 'Account',
        items: [
          ['Email and password sign up and sign in on Firebase Authentication, with sign-out', 'done'],
          ['Live form validation, a password-strength meter and a confirm-match indicator', 'done'],
          ['Native splash screen and a three-page onboarding flow', 'done'],
        ],
      },
      {
        title: 'Tasks',
        items: [
          ['Create, edit, delete and toggle completion, persisted in Cloud Firestore', 'done'],
          ['A task carries a title, description, date and time, priority, category and recurrence', 'done'],
          ['Add-task bottom sheet with priority and date pickers, plus a task-detail screen', 'done'],
        ],
      },
      {
        title: 'Streaks and statistics',
        items: [
          ['A streak service that advances when a task is completed, and resets', 'done'],
          ['A statistics screen charting task completion with fl_chart', 'done'],
        ],
      },
      {
        title: 'Profile',
        items: [
          ['Display-name editing, and profile-image upload and removal via Firebase Storage', 'done'],
          ['Image selection through image_picker, with runtime permission handling', 'done'],
        ],
      },
    ],
    ar: [
      {
        title: 'الحساب',
        items: [
          ['تسجيل الدخول وإنشاء حساب بالبريد وكلمة المرور عبر Firebase Authentication، مع تسجيل الخروج', 'done'],
          ['تحقق فوري من المدخلات، ومؤشر لقوة كلمة المرور وآخر لتطابق التأكيد', 'done'],
          ['شاشة بداية أصلية وثلاث صفحات تعريفية', 'done'],
        ],
      },
      {
        title: 'المهام',
        items: [
          ['إضافة وتعديل وحذف المهام وتبديل حالة الإنجاز، محفوظة في Cloud Firestore', 'done'],
          ['كل مهمة تحمل عنوانًا ووصفًا وتاريخًا ووقتًا وأولوية وتصنيفًا وتكرارًا', 'done'],
          ['نافذة سفلية لإضافة مهمة مع منتقي الأولوية والتاريخ، وشاشة لتفاصيل المهمة', 'done'],
        ],
      },
      {
        title: 'التتابع والإحصاءات',
        items: [
          ['خدمة تتابع تتقدم عند إتمام مهمة، وتُصفَّر عند الانقطاع', 'done'],
          ['شاشة إحصاءات ترسم معدل الإنجاز باستخدام fl_chart', 'done'],
        ],
      },
      {
        title: 'الملف الشخصي',
        items: [
          ['تعديل الاسم الظاهر، ورفع صورة الملف الشخصي وحذفها عبر Firebase Storage', 'done'],
          ['اختيار الصورة عبر image_picker مع معالجة أذونات النظام', 'done'],
        ],
      },
    ],
  },
};
