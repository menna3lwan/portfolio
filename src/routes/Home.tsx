import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { homeDescription, homeTitle } from '@/seo/meta';
import { Hero } from '@/features/home/Hero';
import { Skills } from '@/features/home/Skills';
import { Works } from '@/features/home/Works';
import { Experience } from '@/features/home/Experience';
import { About } from '@/features/home/About';
import { Contact } from '@/features/home/Contact';

/** The reference's page, in its order — hero, skills reel, selected works — then the
 *  experience and about sections drawn in the same language, and contact.
 *  Keyed by language so every scroll-linked animation is rebuilt for the new layout
 *  direction rather than patched. */
export default function Home() {
  const { content, lang } = useLanguage();
  useDocumentMeta({
    title: homeTitle(content, lang),
    description: homeDescription(content),
    path: '/',
    lang,
  });

  return (
    <div key={lang}>
      <Hero />
      <Skills />
      <div id="portfolio-section" />
      <Works />
      <Experience />
      <About />
      <Contact />
    </div>
  );
}
