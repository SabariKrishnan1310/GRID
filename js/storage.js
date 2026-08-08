/* ============================================
   GRID — Storage Module
   Fetches index.json + individual note files
   ============================================ */

const GridStorage = (() => {
  let _subjects = [];
  let _index = null;
  let _noteCache = new Map();

  const DATA_BASE = 'data';

  async function fetchJSON(path) {
    try {
      const res = await fetch(`${DATA_BASE}/${path}`);
      if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[GRID Storage] ${err.message}`);
      return null;
    }
  }

  async function fetchText(path) {
    try {
      const res = await fetch(`${DATA_BASE}/${path}`);
      if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
      return await res.text();
    } catch (err) {
      console.error(`[GRID Storage] ${err.message}`);
      return null;
    }
  }

  async function loadSubjects() {
    if (_subjects.length) return _subjects;
    _subjects = await fetchJSON('subjects.json') || [];
    return _subjects;
  }

  async function loadIndex() {
    if (_index) return _index;
    _index = await fetchJSON('index.json') || { notes: [] };
    return _index;
  }

  async function loadNote(noteId) {
    if (_noteCache.has(noteId)) return _noteCache.get(noteId);

    const index = await loadIndex();
    const meta = index.notes.find(n => n.id === noteId);
    if (!meta) return null;

    const raw = await fetchText(`notes/${meta.subject}/${meta.chapter}/${noteId}.md`);
    if (!raw) return null;

    const note = parseNoteFrontmatter(raw, meta);
    _noteCache.set(noteId, note);
    return note;
  }

  function parseNoteFrontmatter(raw, meta) {
    const fm = {};
    let content = raw;

    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fmBlock = fmMatch[1];
      content = fmMatch[2];

      fmBlock.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();

        if (val.startsWith('[') || val.startsWith('"')) {
          try { val = JSON.parse(val); } catch {}
        } else if (val === 'true') val = true;
        else if (val === 'false') val = false;

        fm[key] = val;
      });
    }

    return {
      id: meta.id,
      subject: meta.subject,
      chapter: meta.chapter,
      title: fm.title || meta.title || meta.id,
      content: content.trim(),
      tags: fm.tags || meta.tags || [],
      color: fm.color || meta.color || null,
      pinned: fm.pinned || meta.pinned || false,
      created: fm.created || meta.created || null,
      updated: fm.updated || meta.updated || null,
    };
  }

  async function getNotesForChapter(subjectId, chapterId) {
    const index = await loadIndex();
    return index.notes
      .filter(n => n.subject === subjectId && n.chapter === chapterId)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated || b.created || 0) - new Date(a.updated || a.created || 0);
      });
  }

  async function getAllNotes() {
    const index = await loadIndex();
    return index.notes;
  }

  function invalidateCache() {
    _noteCache.clear();
    _index = null;
  }

  return {
    loadSubjects,
    loadIndex,
    loadNote,
    getNotesForChapter,
    getAllNotes,
    invalidateCache,
  };
})();
