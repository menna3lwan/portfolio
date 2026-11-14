import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { homeDescription, homeTitle } from '@/seo/meta';
import { Hero } from '@/features/hero/Hero';
import { WhoAmI } from '@/features/whoami/WhoAmI';
import { WorkSection } from '@/features/work/WorkSection';
import { ExperienceSection } from '@/features/experience/ExperienceSection';
import { Contact } from '@/features/contact/Contact';

/** The issue, in order: masthead and hero, whoami, the two chapters, the statement. */
export default function Home() {
  const { content, lang } = useLanguage();
  useDocumentMeta({
    title: homeTitle(content, lang),
    description: homeDescription(content),
    path: '/',
    lang,
  });

  return (
    <>
      <Hero />
      <WhoAmI />
      <WorkSection />
      <ExperienceSection />
      <Contact />
    </>
  );
}
