/**
 * Scale down only the elements whose longest word would overflow their column, so a
 * word is never broken mid-way; everything that fits keeps its full size. Writes a
 * `--fit` factor the stylesheet multiplies into the font size. The visible text is read
 * from a `[data-split]` child when there is one, so a screen-reader copy beside it is
 * not counted.
 */
export function fitText(elements: Iterable<HTMLElement>): void {
  const list = [...elements];
  // Under reduced motion every property has a near-zero transition, which would make the
  // computed size lag one frame behind the removed factor; measure without it.
  list.forEach((el) => {
    el.style.transition = 'none';
    el.style.removeProperty('--fit');
  });
  list.forEach((el) => {
    const column = el.clientWidth;
    if (!column) return;
    const visible = (el.querySelector('[data-split]') ?? el).textContent ?? '';
    // The probe copies the element's own type, so no rule aimed at spans can change what
    // is measured.
    const cs = getComputedStyle(el);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    probe.style.font = cs.font;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.style.textTransform = cs.textTransform;
    let widest = 0;
    for (const token of visible.split(/\s+/)) {
      if (!token) continue;
      probe.textContent = token;
      el.appendChild(probe);
      widest = Math.max(widest, probe.getBoundingClientRect().width);
      probe.remove();
    }
    if (widest > column) el.style.setProperty('--fit', (column / widest - 0.01).toFixed(3));
  });
  list.forEach((el) => el.style.removeProperty('transition'));
}
