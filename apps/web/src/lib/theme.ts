/**
 * shadcn's dark styles apply under a `.dark` class on <html>. Until there is a
 * theme toggle, follow the system setting and keep following it if it changes.
 */
export function syncThemeWithSystem() {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => document.documentElement.classList.toggle('dark', query.matches);
  apply();
  query.addEventListener('change', apply);
}
