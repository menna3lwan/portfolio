/**
 * The loading state for a lazily-loaded route.
 *
 * It reserves the viewport height so the header does not jump while the chunk arrives,
 * and says nothing visually — a spinner for a chunk that usually resolves in a frame is
 * noise, but the live region still announces it for a screen reader.
 */
export function RouteFallback() {
  return (
    <div style={{ minHeight: '60vh' }} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
    </div>
  );
}
