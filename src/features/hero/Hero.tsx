import { Reveal } from '@/components/ui/Reveal';
import { HeroSocialLinks } from '@/components/ui/SocialLinks';
import { TickList } from '@/components/ui/lists';
import { Portrait } from './Portrait';
import { useLanguage } from '@/app/hooks/useAppContext';

/**
 * The hero: the magazine masthead line that opens the issue, the name block, the
 * portrait, and the one card that belongs to the hero itself.
 */
export function Hero() {
  const { content, t } = useLanguage();
  const { hero, meta, about, education } = content;

  // the "who I am" card is her own about copy, one line per statement
  const whoLines = [
    about.title,
    ...about.body.slice(0, 2),
    `${education.degree} — ${education.school}`,
  ].filter(Boolean);

  return (
    <section className="hero" id="hero">
      <div className="container">
        <Reveal className="masthead mono">
          <span>{t.issue}</span>
          <span>{t.edition}</span>
          <span>{t.where}</span>
          <span>{t.est}</span>
        </Reveal>

        <div className="hero__grid">
          <div className="hero__intro">
            <Reveal as="h1" className="hero__heading">
              <span className="hero__name display">{meta.name}</span>
              <span className="hero__role display">{meta.role}</span>
            </Reveal>
            <Reveal as="p" className="hero__tagline display" index={1}>
              {hero.title.join(' ')}
            </Reveal>
            <Reveal as="p" className="hero__subname" index={2}>
              {hero.facts.map(([key, value]) => (
                <span key={key}>{value}</span>
              ))}
            </Reveal>
            <Reveal className="hero__cta" index={3}>
              <HeroSocialLinks />
            </Reveal>
          </div>

          <Portrait />
        </div>

        <div className="hero__about">
          <Reveal className="card">
            <h2 className="eyebrow">{t.whoIAm}</h2>
            <TickList items={whoLines} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
