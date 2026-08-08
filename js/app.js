/* ============================================
   GRID - App Controller
   Main orchestrator: sidebar, nav, state
   ============================================ */

const GridApp = (() => {
  let _subjects = [];
  let _currentNote = null;
  let _sidebarOpen = true;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Resolve the chapter name for a note (used by PDF export)
  function getChapterName(note) {
    if (!note) return '';
    const subject = _subjects.find(s => s.id === note.subject);
    const chapter = subject?.chapters?.find(c => c.id === note.chapter);
    if (chapter?.name) return chapter.name;
    // Fallback: derive a readable name from the note title (drop the " - " suffix)
    const parts = note.title ? note.title.split(' - ') : [];
    return parts[0] || note.chapter || '';
  }

  // ── Subject Icons (Lucide) ──
  const ICON_MAP = {
    atom: 'atom',
    flask: 'flask-conical',
    leaf: 'leaf',
    sigma: 'sigma',
    globe: 'globe',
    book: 'book-open',
    languages: 'languages',
    brain: 'brain',
    palette: 'palette',
  };

  // ── Initialize ──
  async function init() {
    GridRenderer.init();
    loadTheme();
    bindEvents();
    await loadSidebar();
    initLucide();
    updateWelcomeStats();
    handleHashRoute();
  }

  function initLucide() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ── Theme ──
  function loadTheme() {
    const saved = localStorage.getItem('grid-theme');
    const theme = saved || 'light';
    document.documentElement.dataset.theme = theme;
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('grid-theme', next);
    initLucide();
  }

  // ── Sidebar ──
  async function loadSidebar() {
    _subjects = await GridStorage.loadSubjects();
    const tree = $('#subject-tree');
    tree.innerHTML = '';

    _subjects.forEach(subject => {
      const subjectEl = document.createElement('div');
      subjectEl.className = 'subject-group';
      subjectEl.dataset.subjectId = subject.id;

      const header = document.createElement('button');
      header.className = 'subject-header';
      header.innerHTML = `
        <span class="subject-icon" style="color: ${subject.color}">
          <i data-lucide="${subject.icon || 'folder'}" class="icon-sm"></i>
        </span>
        <span class="subject-name">${subject.name}</span>
        <span class="subject-chevron">
          <i data-lucide="chevron-right" class="icon-xs"></i>
        </span>
      `;
      header.addEventListener('click', () => toggleSubject(subjectEl));

      const chapters = document.createElement('div');
      chapters.className = 'subject-chapters hidden';

      if (subject.chapters && subject.chapters.length) {
        subject.chapters.forEach(chapter => {
          const chEl = document.createElement('button');
          chEl.className = 'chapter-btn';
          chEl.dataset.chapterId = chapter.id;
          chEl.dataset.subjectId = subject.id;
          chEl.innerHTML = `
            <span class="chapter-dot" style="background: ${subject.color}"></span>
            <span class="chapter-name">${chapter.name}</span>
          `;
          chEl.addEventListener('click', () => {
            selectChapter(subject.id, chapter.id);
            setActiveChapter(chEl);
          });
          chapters.appendChild(chEl);
        });
      } else {
        const empty = document.createElement('div');
        empty.className = 'chapter-empty';
        empty.textContent = 'No chapters yet';
        chapters.appendChild(empty);
      }

      subjectEl.appendChild(header);
      subjectEl.appendChild(chapters);
      tree.appendChild(subjectEl);
    });
  }

  function toggleSubject(el) {
    const chapters = el.querySelector('.subject-chapters');
    const chevron = el.querySelector('.subject-chevron');
    const isOpen = !chapters.classList.contains('hidden');

    chapters.classList.toggle('hidden');
    chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
  }

  function setActiveChapter(el) {
    $$('.chapter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  // ── Chapter Selection ──
  async function selectChapter(subjectId, chapterId) {
    const subject = _subjects.find(s => s.id === subjectId);
    const chapter = subject?.chapters?.find(c => c.id === chapterId);
    if (!subject || !chapter) return;

    const notes = await GridStorage.getNotesForChapter(subjectId, chapterId);

    if (notes.length === 0) {
      showEmptyState(subject, chapter);
    } else if (notes.length === 1) {
      await openNote(notes[0].id);
    } else {
      showNoteList(subject, chapter, notes);
    }

    closeSidebarMobile();
  }

  function showEmptyState(subject, chapter) {
    $('#welcome-screen').classList.add('hidden');
    $('#note-viewer').classList.add('hidden');
    const empty = $('#empty-state');
    empty.classList.remove('hidden');
    empty.querySelector('.empty-title').textContent = `${subject.name} - ${chapter.name}`;
    empty.querySelector('.empty-text').innerHTML = 'No notes yet.<br>The agent will publish them soon.';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function showNoteList(subject, chapter, notes) {
    const content = `
      <div class="note-list-view">
        <div class="note-list-header">
          <span class="note-breadcrumb">${subject.name} / ${chapter.name}</span>
          <h2 class="note-list-title">${chapter.name}</h2>
          <span class="note-list-count">${notes.length} note${notes.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="note-list">
          ${notes.map(note => `
            <button class="note-card" data-note-id="${note.id}">
              ${note.color ? `<span class="note-card-color" style="background: var(--grid-label-${note.color})"></span>` : ''}
              <div class="note-card-body">
                <h3 class="note-card-title">${note.title || note.id}</h3>
                <div class="note-card-meta">
                  ${note.tags && note.tags.length ? note.tags.map(t => `<span class="tag-badge">${t}</span>`).join('') : ''}
                  ${note.updated ? `<span class="note-card-date">${new Date(note.updated).toLocaleDateString('en-IN')}</span>` : ''}
                </div>
              </div>
              <i data-lucide="chevron-right" class="icon-sm note-card-arrow"></i>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    $('#welcome-screen').classList.add('hidden');
    $('#note-viewer').classList.add('hidden');
    $('#empty-state').classList.add('hidden');

    const main = $('#main-content');
    let listEl = main.querySelector('.note-list-view');
    if (listEl) listEl.remove();

    listEl = document.createElement('div');
    listEl.className = 'note-list-view';
    listEl.innerHTML = content;
    main.appendChild(listEl);

    listEl.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => openNote(card.dataset.noteId));
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Open Note ──
  async function openNote(noteId) {
    const note = await GridStorage.loadNote(noteId);
    if (!note) return;

    _currentNote = note;

    // Hide other views
    $('#welcome-screen').classList.add('hidden');
    $('#empty-state').classList.add('hidden');
    const listEl = $('#main-content').querySelector('.note-list-view');
    if (listEl) listEl.remove();

    // Show note viewer
    const viewer = $('#note-viewer');
    viewer.classList.remove('hidden');

    // Breadcrumb
    const subject = _subjects.find(s => s.id === note.subject);
    const chapter = subject?.chapters?.find(c => c.id === note.chapter);
    $('#note-breadcrumb').textContent = `${subject?.name || note.subject} / ${chapter?.name || note.chapter}`;

    // Title
    $('#note-title').textContent = note.title;

    // Meta
    const metaParts = [];
    if (note.created) metaParts.push(`Created ${new Date(note.created).toLocaleDateString('en-IN')}`);
    if (note.updated) metaParts.push(`Updated ${new Date(note.updated).toLocaleDateString('en-IN')}`);
    metaParts.push(`${GridRenderer.wordCount(note.content)} words`);
    $('#note-date').textContent = metaParts.join(' · ');

    // Tags
    const tagsEl = $('#note-tags');
    if (note.tags && note.tags.length) {
      tagsEl.innerHTML = note.tags.map(t => `<span class="tag-badge">${t}</span>`).join('');
    } else {
      tagsEl.innerHTML = '';
    }

    // Color bar
    const colorBar = $('#note-color-bar');
    if (note.color) {
      colorBar.classList.remove('hidden');
      colorBar.style.background = `var(--grid-label-${note.color})`;
    } else {
      colorBar.classList.add('hidden');
    }

    // Pin state
    const pinBtn = $('#note-pin');
    pinBtn.classList.toggle('active', note.pinned);

    // Render content
    const rendered = GridRenderer.render(note.content);
    $('#note-content').innerHTML = rendered;

    // Re-render Mermaid after DOM update
    requestAnimationFrame(() => GridRenderer.rehighlightMermaid());

    // Update URL
    history.pushState(null, '', `#${note.subject}/${note.chapter}/${note.id}`);

    // Init icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Welcome Stats ──
  async function updateWelcomeStats() {
    const index = await GridStorage.loadIndex();
    const stats = $('#welcome-stats');
    const count = index.notes ? index.notes.length : 0;
    const subjects = new Set((index.notes || []).map(n => n.subject)).size;

    stats.innerHTML = `
      <div class="stat-card">
        <span class="stat-number">${count}</span>
        <span class="stat-label">Notes</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${subjects}</span>
        <span class="stat-label">Subjects</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${_subjects.reduce((a, s) => a + (s.chapters?.length || 0), 0)}</span>
        <span class="stat-label">Chapters</span>
      </div>
    `;
  }

  // ── Search ──
  async function handleSearch(query) {
    const resultsEl = $('#search-results');

    if (!query || query.length < 2) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      return;
    }

    const results = await GridSearch.search(query);

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="search-empty">No results found</div>';
    } else {
      resultsEl.innerHTML = results.map(r => {
        const subject = _subjects.find(s => s.id === r.subject);
        return `
          <button class="search-result" data-note-id="${r.id}">
            <span class="search-result-icon" style="color: ${subject?.color || '#888'}">
              <i data-lucide="${subject?.icon || 'file-text'}" class="icon-xs"></i>
            </span>
            <div class="search-result-body">
              <span class="search-result-title">${GridSearch.highlightText(r.title || r.id, query)}</span>
              <span class="search-result-snippet">${GridSearch.highlightText(r.snippet, query)}</span>
            </div>
          </button>
        `;
      }).join('');
    }

    resultsEl.classList.remove('hidden');

    resultsEl.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('click', () => {
        openNote(el.dataset.noteId);
        resultsEl.classList.add('hidden');
        $('#search-input').value = '';
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Sidebar Mobile ──
  function toggleSidebar() {
    _sidebarOpen = !_sidebarOpen;
    const sidebar = $('#sidebar');
    sidebar.classList.toggle('open', _sidebarOpen);
  }

  function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
      $('#sidebar').classList.remove('open');
    }
  }

  // ── Hash Routing ──
  function handleHashRoute() {
    const hash = location.hash.slice(1);
    if (hash) {
      const parts = hash.split('/');
      if (parts.length === 3) {
        openNote(parts[2]);
      }
    }
  }

  // ── Events ──
  function bindEvents() {
    // Theme
    $('#theme-toggle')?.addEventListener('click', toggleTheme);

    // Sidebar toggle
    $('#sidebar-toggle')?.addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
    });
    $('#sidebar-close')?.addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
    });

    // Search
    let searchTimeout;
    $('#search-input')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => handleSearch(e.target.value), 200);
    });

    // Close search on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.sidebar-search')) {
        $('#search-results')?.classList.add('hidden');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // / to focus search
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        $('#search-input')?.focus();
      }
      // Escape to close search
      if (e.key === 'Escape') {
        $('#search-results')?.classList.add('hidden');
        $('#search-input')?.blur();
      }
      // D for dark mode
      if (e.key === 'd' && !e.target.matches('input, textarea') && !e.ctrlKey && !e.metaKey) {
        toggleTheme();
      }
      // E for export
      if (e.key === 'e' && !e.target.matches('input, textarea') && !e.ctrlKey && !e.metaKey) {
        if (_currentNote) {
          const rendered = $('#note-content').innerHTML;
          GridExport.generatePDF(_currentNote, rendered, getChapterName(_currentNote));
        }
      }
    });

    // Export button
    $('#note-export')?.addEventListener('click', () => {
      if (_currentNote) {
        const rendered = $('#note-content').innerHTML;
        GridExport.generatePDF(_currentNote, rendered, getChapterName(_currentNote));
      }
    });

    // Hash change
    window.addEventListener('hashchange', handleHashRoute);

    // Responsive
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        $('#sidebar')?.classList.remove('open');
      }
    });
  }

  return { init };
})();

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => GridApp.init());
