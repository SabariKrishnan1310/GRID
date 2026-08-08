/* ============================================
   GRID — Renderer Module
   Markdown → HTML with KaTeX, Mermaid, SVG
   ============================================ */

const GridRenderer = (() => {
  let _mermaidInit = false;

  function init() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
      });
    }

    if (typeof mermaid !== 'undefined' && !_mermaidInit) {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
      });
      _mermaidInit = true;
    }
  }

  function render(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Extract and preserve HTML blocks (SVGs, raw HTML)
    const htmlBlocks = [];
    html = html.replace(/<(svg|div|table|img|canvas)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
      const placeholder = `__GRID_HTML_BLOCK_${htmlBlocks.length}__`;
      htmlBlocks.push(match);
      return placeholder;
    });

    // Also preserve inline HTML tags that aren't block-level
    const inlineHtmlBlocks = [];
    html = html.replace(/<(?!\/?(?:p|br|hr|div|span|table|tr|td|th|thead|tbody|svg|g|path|circle|rect|line|text|polygon|polyline|ellipse|defs|marker|pattern|clipPath|linearGradient|radialGradient|feBlend|feFlood|feGaussianBlur|feImage|feMerge|feMergeNode|feOffset|feSpecularLighting|feTile|feTurbulence|use|image|switch|foreignObject)(?:[^>]+)?)>([\s\S]*?)<\/[^>]+>/gi, (match) => {
      const placeholder = `__GRID_INLINE_HTML_${inlineHtmlBlocks.length}__`;
      inlineHtmlBlocks.push(match);
      return placeholder;
    });

    // Render Markdown
    html = marked.parse(html);

    // Restore inline HTML
    inlineHtmlBlocks.forEach((block, i) => {
      html = html.replace(`__GRID_INLINE_HTML_${i}__`, block);
    });

    // Restore HTML blocks
    htmlBlocks.forEach((block, i) => {
      html = html.replace(`<p>__GRID_HTML_BLOCK_${i}__</p>`, block);
      html = html.replace(`__GRID_HTML_BLOCK_${i}__`, block);
    });

    // Render KaTeX (inline: $...$, display: $$...$$)
    html = renderKaTeX(html);

    // Render Mermaid diagrams
    html = renderMermaid(html);

    return html;
  }

  function renderKaTeX(html) {
    if (typeof katex === 'undefined') return html;

    // Display math: $$...$$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
      try {
        return katex.renderToString(tex.trim(), {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch {
        return `<span class="katex-error" title="${tex}">${tex}</span>`;
      }
    });

    // Inline math: $...$
    html = html.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
      try {
        return katex.renderToString(tex.trim(), {
          displayMode: false,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch {
        return `<span class="katex-error" title="${tex}">${tex}</span>`;
      }
    });

    return html;
  }

  function renderMermaid(html) {
    if (typeof mermaid === 'undefined') return html;

    const mermaidBlocks = [];
    html = html.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
      const id = `mermaid-${Date.now()}-${mermaidBlocks.length}`;
      mermaidBlocks.push({ id, code: code.trim() });
      return `<div class="mermaid-placeholder" data-mermaid-id="${id}"></div>`;
    });

    // Process async after DOM update
    if (mermaidBlocks.length > 0) {
      requestAnimationFrame(async () => {
        for (const block of mermaidBlocks) {
          const el = document.querySelector(`[data-mermaid-id="${block.id}"]`);
          if (el) {
            try {
              const { svg } = await mermaid.render(block.id, block.code);
              el.outerHTML = svg;
            } catch {
              el.innerHTML = `<pre class="mermaid-error">${block.code}</pre>`;
            }
          }
        }
      });
    }

    return html;
  }

  function renderPreview(markdown, maxLen = 200) {
    if (!markdown) return '';
    let text = markdown
      .replace(/^---[\s\S]*?---\n/m, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1]')
      .replace(/\$[^$]+\$/g, '[formula]')
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .trim();

    if (text.length > maxLen) {
      text = text.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
    }
    return text;
  }

  function wordCount(markdown) {
    if (!markdown) return 0;
    const text = markdown
      .replace(/^---[\s\S]*?---\n/m, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_`~\[\]()>#\-+|]/g, '')
      .replace(/\$[^$]+\$/g, '')
      .trim();
    return text.split(/\s+/).filter(Boolean).length;
  }

  function rehighlightMermaid() {
    if (typeof mermaid === 'undefined') return;
    document.querySelectorAll('.mermaid-placeholder[data-mermaid-id]').forEach(async (el) => {
      const id = el.dataset.mermaidId;
      const code = el.textContent;
      if (!code) return;
      try {
        const { svg } = await mermaid.render(id, code);
        el.outerHTML = svg;
      } catch {
        el.innerHTML = `<pre class="mermaid-error">${code}</pre>`;
      }
    });
  }

  return { init, render, renderPreview, wordCount, rehighlightMermaid };
})();
