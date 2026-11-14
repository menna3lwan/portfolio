import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';

type TokenKind = 'k' | 's' | 'c' | 'n';

/** A token: a class name and its text. Every string below is read from the content file —
 *  the window is a presentation device, not invented code. */
const token = (kind: TokenKind, text: string): ReactNode => (
  <span className={kind}>{text}</span>
);

const identifier = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, '_');

/**
 * A Dart rendering of what the about page already says.
 *
 * The window is forced to LTR because code reads left to right in both languages, and
 * the `code`/`pre` family is pinned to the mono token in the base layer — the UA sheet's
 * generic monospace would otherwise beat inheritance here.
 */
export function CodeWindow() {
  const { content } = useLanguage();
  const { about, meta, hero } = content;

  const lines: ReactNode[] = [
    token('c', `// ${about.title}`),
    <Fragment key="class">
      {token('k', 'class')} {token('n', 'MennaElwan')} {'{'}
    </Fragment>,
    <Fragment key="title">
      {'  '}
      {token('k', 'final')} title = {token('s', `'${meta.role}'`)};
    </Fragment>,
    ...hero.facts.map(([key, value]) => (
      <Fragment key={key}>
        {'  '}
        {token('k', 'final')} {identifier(key)} = {token('s', `'${value}'`)};
      </Fragment>
    )),
    '',
    <Fragment key="who">
      {'  '}
      {token('k', 'String')} {token('n', 'whoAmI')}() {'=>'} {token('s', `'${about.title}'`)};
    </Fragment>,
    <Fragment key="enjoy">
      {'  '}
      {token('k', 'String')} {token('n', 'whatIEnjoy')}() {'=>'}{' '}
      {token('s', `'${(about.body[1] || about.body[0] || '').slice(0, 52)}…'`)};
    </Fragment>,
    '}',
  ];

  return (
    <>
      <div className="code-window__bar">
        <span className="code-window__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="code-window__file">menna.dart</span>
        <span className="code-window__run">▶ run</span>
      </div>
      <pre className="code-window__code">
        <code>
          {lines.map((line, i) => (
            <Fragment key={i}>
              {line}
              {i < lines.length - 1 ? '\n' : null}
            </Fragment>
          ))}
        </code>
      </pre>
      <div className="code-window__output">
        <p className="code-window__prompt">&gt;&gt;&gt; MennaElwan().whoAmI()</p>
        <p className="code-window__result">{about.title}</p>
      </div>
    </>
  );
}
