import type { CSSProperties } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { CodeWindow } from './CodeWindow';
import { MarkedText } from './MarkedText';
import { useLanguage } from '@/app/hooks/useAppContext';

/**
 * Who am I — an editorial spread: a split head whose two phrases carry different weight,
 * a lede in the display face, the narrative with her own phrases marked, three facets,
 * and the code window alongside.
 */
export function WhoAmI() {
  const { content, t } = useLanguage();
  const { about } = content;

  // Three facets, each already evidenced elsewhere in the portfolio: the architecture she
  // builds to, the way she proves a change, and the two languages she ships in.
  const facets: ReadonlyArray<readonly [string, string]> = [
    [t.facetArchK, t.facetArchV],
    [t.facetProofK, t.facetProofV],
    [t.facetLangK, t.facetLangV],
  ];

  return (
    <section className="section whoami" id="whoami" aria-labelledby="whoami-h">
      <div className="container">
        <Reveal as="header" className="section-head section-head--split">
          <span className="eyebrow">{t.whoamiEyebrow}</span>
          <h2 className="section-head__title display" id="whoami-h">
            <span className="title__small">{t.whoamiTitle[0]}</span>
            <span className="title__big">
              {t.whoamiTitle[1]}
              <i className="title__rule" aria-hidden="true" />
            </span>
          </h2>
          <p className="section-head__kicker">{t.whoamiKicker}</p>
        </Reveal>

        <div className="whoami__spread">
          <div className="whoami__col">
            <Reveal as="p" className="whoami__lede display">
              {about.title}
            </Reveal>
            {about.body.map((paragraph, i) => (
              <Reveal key={i} as="p" className="whoami__p" index={i + 1}>
                <MarkedText text={paragraph} />
              </Reveal>
            ))}
            <Reveal as="ul" className="facets" index={3}>
              {facets.map(([key, value], i) => (
                <li key={key} className="facet" style={{ '--n': i } as CSSProperties}>
                  <span className="facet__k mono">{key}</span>
                  <span className="facet__v">{value}</span>
                </li>
              ))}
            </Reveal>
          </div>

          <Reveal className="code-window" index={2}>
            <CodeWindow />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
