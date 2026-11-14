import { useMemo } from 'react';
import type {
  AppRecord,
  ArchitectureLayer,
  Challenge,
  Decision,
  ScopeGroup,
  Status,
} from '@/content/types';
import { useLanguage } from '@/app/hooks/useAppContext';
import {
  applyHenLehenCorrections,
  CLASSIFICATION,
  correctScope,
  HEN_LEHEN_IDS,
  HEN_LEHEN_STATUS,
  SCOPE_SUPPLEMENT,
} from '@/data/corrections';
import { shotsFor } from '@/data/previews';
import type { Shot } from '@/data/previews';
import type { Stat } from '@/components/ui/StatGrid';
import { scopeItemCount } from './scopeCount';

const textOf = (value: string | Decision): string =>
  typeof value === 'string' ? value : (value.text ?? value.title ?? '');

export interface AppEntryModel {
  record: AppRecord;
  /** The corrected classification kicker, where one applies. */
  classification: string | null;
  status: Status | undefined;
  meta: string[];
  stats: Stat[];
  highlights: readonly string[];
  stack: string[];
  scope: ScopeGroup[];
  scopeCount: number;
  layers: readonly ArchitectureLayer[];
  decisions: string[];
  challenges: readonly Challenge[];
  qualityItems: string[];
  links: readonly (readonly [string, string])[];
  shots: readonly Shot[];
}

/**
 * Everything one entry card needs, derived once.
 *
 * This is where the corrections layer is applied and where every figure in the stat grid
 * is counted from the content — nothing below is estimated, and each number is labelled
 * as the thing it counts.
 */
export function useAppEntry(input: AppRecord): AppEntryModel {
  const { lang, t } = useLanguage();

  return useMemo(() => {
    const record = HEN_LEHEN_IDS.includes(input.id as (typeof HEN_LEHEN_IDS)[number])
      ? applyHenLehenCorrections(input)
      : input;

    const detail = record.detail ?? {};
    const architecture = detail.architecture ?? {};
    const layers = architecture.layers ?? [];
    const stack = [...(record.stack?.core ?? []), ...(record.stack?.supporting ?? [])];
    const highlights = record.highlights ?? [];
    const challenges = detail.challenges ?? [];

    const classification = HEN_LEHEN_IDS.includes(record.id as (typeof HEN_LEHEN_IDS)[number])
      ? CLASSIFICATION[lang]
      : null;

    const status = classification ? HEN_LEHEN_STATUS[lang] : record.status;

    const supplement = SCOPE_SUPPLEMENT[record.id];
    const rawScope: readonly ScopeGroup[] =
      detail.scope && detail.scope.length > 0
        ? detail.scope
        : (supplement?.[lang] ?? supplement?.en ?? []);
    const scope = correctScope(record.id, rawScope);

    const stats: Stat[] = [
      layers.length ? { label: t.sLayers, value: String(layers.length) } : null,
      highlights.length ? { label: t.sHighlights, value: String(highlights.length) } : null,
      stack.length ? { label: t.sStack, value: String(stack.length) } : null,
      architecture.flow?.length ? { label: t.sSteps, value: String(architecture.flow.length) } : null,
      architecture.decisions?.length
        ? { label: t.sDecisions, value: String(architecture.decisions.length) }
        : null,
      challenges.length ? { label: t.sChallenges, value: String(challenges.length) } : null,
    ].filter((stat): stat is Stat => stat !== null);

    // the kicker often already names the year, so a bare repeat of it is dropped
    const metaParts = [
      classification ?? record.kicker ?? '',
      detail.overview?.platform ?? '',
      detail.overview?.timeline ?? '',
    ];
    const unique = [...new Set(metaParts)].filter(Boolean);
    const meta = unique.filter(
      (part) => !(/^\d{4}$/.test(part) && unique.some((other) => other !== part && other.includes(part))),
    );

    const qualityItems = [...(detail.quality?.items ?? []), ...(detail.limits ?? [])]
      .map(textOf)
      .filter(Boolean);

    return {
      record,
      classification,
      status,
      meta,
      stats,
      highlights,
      stack,
      scope,
      scopeCount: scopeItemCount(scope),
      layers,
      decisions: (architecture.decisions ?? []).map(textOf).filter(Boolean),
      challenges,
      qualityItems,
      links: record.links ?? [],
      shots: shotsFor(record),
    };
  }, [input, lang, t]);
}
