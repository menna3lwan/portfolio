import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/ui/Reveal';
import { Icon } from '@/components/ui/Icon';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { socialTargets } from '@/components/ui/socialTargets';
import { useLanguage } from '@/app/hooks/useAppContext';

/** Copy-to-clipboard with an honest result: the label only says "Copied" if it was. */
function CopyEmailButton({ email }: { email: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the clipboard can be blocked; the address is on screen either way */
    }
  }, [email]);

  return (
    <button
      type="button"
      className={`contact__copy${copied ? ' is-done' : ''}`}
      onClick={onCopy}
      aria-label={copied ? t.copied : t.copy}
    >
      {/* The glyph is the confirmation: the label changes too, but a tick landing where
          the copy icon was is read before any word is. */}
      <Icon name={copied ? 'check' : 'copy'} />
      <span aria-live="polite">{copied ? t.copied : t.copy}</span>
    </button>
  );
}

/** The statement footer that closes the issue. */
export function Contact() {
  const { content, t } = useLanguage();
  const { meta, contact, footer } = content;
  const targets = socialTargets(meta, t.cv, true);

  return (
    <footer className="contact" id="contact" aria-labelledby="contact-h">
      <div className="container">
        <Reveal as="p" className="contact__statement display" id="contact-h">
          <span>{t.statement[0]}</span>
          <span>{t.statement[1]}</span>
          <span className="accent">{t.statement[2]}</span>
        </Reveal>

        <div className="contact__grid">
          <Reveal className="card">
            <span className="eyebrow">{t.dropLine}</span>
            <a className="contact__email-row" href={`mailto:${meta.email}`}>
              <Icon name="mail" />
              <span className="contact__email-value mono">{meta.email}</span>
            </a>
            <p className="contact__body">{contact.body}</p>
            <CopyEmailButton email={meta.email} />
          </Reveal>

          <Reveal className="card" index={1}>
            <span className="eyebrow">{t.socials}</span>
            <SocialLinks targets={targets} />
          </Reveal>
        </div>

        <div className="colophon">
          <span>{footer.built}</span>
          <Link to="/#hero">{t.backTop} ↑</Link>
        </div>
      </div>
    </footer>
  );
}
