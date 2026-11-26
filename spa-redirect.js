/* Restores the requested path before the application boots.

   A host that cannot rewrite unknown paths serves 404.html for a deep link; this puts
   the address bar back to the path the visitor actually asked for, so the router opens
   the right route. A host that does rewrite to index.html never loads this file.

   It is a separate file rather than an inline script so the page's Content-Security
   Policy does not need to allow inline script. */
(function () {
  var l = window.location;
  // Match the file wherever it is served from: at an origin root that is "/404.html", on
  // a GitHub Pages project site "/portfolio/404.html".
  if (/\/404\.html$/.test(l.pathname)) return;
  history.replaceState(null, '', l.pathname + l.search + l.hash);
})();
