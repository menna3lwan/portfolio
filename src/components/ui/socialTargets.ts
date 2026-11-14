import type { IconName } from './Icon';

export interface SocialTarget {
  href: string;
  icon: IconName;
  label: string;
  /** An internal route rather than an outside address. */
  internal?: boolean;
}

/** The three profiles plus, where wanted, the CV route at the end of the row. */
export function socialTargets(
  meta: { github: string; linkedin: string; email: string },
  cvLabel: string,
  withCv: boolean,
): SocialTarget[] {
  const targets: SocialTarget[] = [
    { href: meta.github, icon: 'github', label: 'GitHub' },
    { href: meta.linkedin, icon: 'linkedin', label: 'LinkedIn' },
    { href: `mailto:${meta.email}`, icon: 'mail', label: 'Email' },
  ];
  if (withCv) targets.push({ href: '/cv', icon: 'doc', label: cvLabel, internal: true });
  return targets;
}
