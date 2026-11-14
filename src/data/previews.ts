/* =============================================================================
   Screen previews.

   The previews are the designed interface concepts, one per application. Each
   application's own concept is named by its content record's `image` field, so an
   application can only ever show its own picture — the mapping is the content's, not a
   lookup table kept in parallel, and a mismatch is not expressible.

   The concepts are served from img/cut/ — the same artwork with its backdrop masked out,
   so the device stands on the page rather than inside a painted rectangle. The originals
   in img/ are untouched and still published. Each cut is trimmed to its own bounds, so
   its real size is carried here and used verbatim as the frame ratio: nothing is
   stretched, cropped or letterboxed.
   ========================================================================== */
import type { AppRecord } from '@/content/types';
import { asset } from '@/site.config';

export interface Shot {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  /** Narrow variants, so a phone does not download a 950px image for a 240px box. */
  readonly srcSet?: string;
}

/** The widths `scripts/make-image-variants.py` emits beside each concept. */
const VARIANT_WIDTHS = [480, 720] as const;

const srcSetFor = (file: string, width: number): string =>
  [
    ...VARIANT_WIDTHS.filter((w) => w < width).map(
      (w) => `${asset(file.replace(/\.webp$/, ''))}-${w}w.webp ${w}w`,
    ),
    `${asset(file)} ${width}w`,
  ].join(', ');

/** Matches the frame's own CSS: min(78vw, 310px) below 680px, clamp(240px, 32vw, 430px)
 *  above it. Written in plain units, which every browser resolves in a `sizes` list. */
export const PREVIEW_SIZES = '(max-width: 680px) 78vw, (max-width: 1400px) 32vw, 430px';

/** Measured pixel size of each masked concept, used as the frame's aspect ratio. */
const CUT_DIMENSIONS: Readonly<Record<string, readonly [number, number]>> = {
  'elevate-exams-ui-concept.webp': [947, 1157],
  'flower-app-ui-concept.webp': [948, 1158],
  'flowery-ui-concept.webp': [947, 1158],
  'hen-lehen-backend-ui-concept.webp': [889, 915],
  'hen-lehen-doctor-ui-concept.webp': [947, 1158],
  'hen-lehen-patient-ui-concept.webp': [947, 1158],
  'hen-lehen-ui-concept.webp': [947, 1157],
  'mentorx-parent-ui-concept.webp': [947, 1157],
  'mentorx-student-ui-concept.webp': [947, 1158],
  // Rebuilt from the source artwork's measured element geometry: the phone body at
  // x[392-981] y[99-1277] with its cut-off bottom bezel restored, and the floating card
  // re-cut at its own panel bounds and scaled to 52% of the device's width.
  'movie-app-ui-concept.webp': [858, 1209],
  'tasky-ui-concept.webp': [947, 1157],
  'tracking-app-ui-concept.webp': [947, 1158],
  'xper-erp-ui-concept.webp': [910, 896],
};

const FALLBACK_SIZE = [1024, 1280] as const;

/**
 * The screens an application shows. One concept each today; the switcher renders
 * automatically for any application that gains a second, and the stage follows whichever
 * is active, so no screen is ever letterboxed.
 */
export function shotsFor(record: AppRecord | undefined): Shot[] {
  if (!record?.image) return [];
  const base = record.image.split('/').pop() ?? record.image;
  const size = CUT_DIMENSIONS[base];
  if (!size) {
    return [
      {
        file: asset(record.image),
        width: FALLBACK_SIZE[0],
        height: FALLBACK_SIZE[1],
        label: record.name,
      },
    ];
  }
  const file = `img/cut/${base}`;
  return [
    {
      file: asset(file),
      width: size[0],
      height: size[1],
      label: record.name,
      srcSet: srcSetFor(file, size[0]),
    },
  ];
}
