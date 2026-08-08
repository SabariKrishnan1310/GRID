/* ============================================
   GRID - Search Module
   Full-text search with highlights
   ============================================ */

const GridSearch = (() => {
  let _allNotes = [];
  let _built = false;

  async function buildIndex() {
    if (_built) return;
    const index = await GridStorage.loadIndex();
    _allNotes = index.notes || [];
    _built = true;
  }

  async function search(query) {
    await buildIndex();
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();
    const results = [];

    for (const note of _allNotes) {
      const titleMatch = (note.title || '').toLowerCase().includes(q);
      const tagMatch = (note.tags || []).some(t => t.toLowerCase().includes(q));
      const subjectMatch = (note.subject || '').toLowerCase().includes(q);

      let contentScore = 0;
      let contentSnippet = '';

      if (titleMatch || tagMatch || subjectMatch) {
        contentScore = titleMatch ? 3 : (tagMatch ? 2 : 1);
      }

      // Load note content for full-text search (lazy)
      if (contentScore === 0) {
        const full = await GridStorage.loadNote(note.id, note.subject, note.chapter);
        if (full && full.content) {
          const contentLower = full.content.toLowerCase();
          const idx = contentLower.indexOf(q);
          if (idx !== -1) {
            contentScore = 1;
            const start = Math.max(0, idx - 40);
            const end = Math.min(full.content.length, idx + q.length + 40);
            contentSnippet = full.content.slice(start, end).replace(/[#*`$\[\]]/g, '');
          }
        }
      }

      if (contentScore > 0) {
        results.push({
          ...note,
          score: contentScore,
          snippet: contentSnippet || (note.title || '').slice(0, 80),
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  }

  function highlightText(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function highlightHTML(html, query) {
    if (!query || !html) return html;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Only highlight text nodes, not inside tags
    const regex = new RegExp(`(?<=>)([^<]*?)(${escaped})([^<]*?)(?=<)`, 'gi');
    return html.replace(regex, (match, before, query, after) => {
      return `>${before}<mark class="search-highlight">${query}</mark>${after}<`;
    });
  }

  function reset() {
    _allNotes = [];
    _built = false;
  }

  return { buildIndex, search, highlightText, highlightHTML, reset };
})();
