/* ============================================
   GRID - Export Module
   Minimal PDF export: GRID + chapter name only
   ============================================ */

const GridExport = (() => {

  function generatePDF(note, renderedHTML, chapterName) {
    const container = document.createElement('div');
    container.className = 'grid-pdf-container';
    container.innerHTML = `
      <style>
        .grid-pdf-container {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1A1A2E;
          padding: 40px;
          max-width: 780px;
          margin: 0 auto;
        }
        .pdf-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .pdf-logo {
          width: 30px;
          height: 30px;
          background: #2D6A4F;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
        }
        .pdf-brand {
          font-size: 13px;
          font-weight: 600;
          color: #2D6A4F;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .pdf-title {
          font-size: 26px;
          font-weight: 700;
          color: #1B4332;
          margin: 0 0 4px 0;
          line-height: 1.2;
          padding-bottom: 14px;
          border-bottom: 2px solid #D8F3DC;
        }
        .pdf-body h1 { font-size: 24px; color: #1B4332; margin: 32px 0 12px; }
        .pdf-body h2 { font-size: 20px; color: #2D6A4F; margin: 28px 0 10px; border-bottom: 1px solid #D8F3DC; padding-bottom: 6px; }
        .pdf-body h3 { font-size: 17px; color: #40916C; margin: 24px 0 8px; }
        .pdf-body p { line-height: 1.7; margin: 0 0 16px; }
        .pdf-body ul, .pdf-body ol { margin: 0 0 16px; padding-left: 24px; }
        .pdf-body li { margin: 4px 0; line-height: 1.6; }
        .pdf-body code {
          background: #F0FFF4;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.88em;
          color: #1B4332;
        }
        .pdf-body pre {
          background: #F8F8FA;
          border: 1px solid #ECECEF;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 0 0 16px;
        }
        .pdf-body pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .pdf-body blockquote {
          border-left: 3px solid #52B788;
          margin: 0 0 16px;
          padding: 12px 20px;
          background: #F0FFF4;
          border-radius: 0 8px 8px 0;
          color: #2E2E33;
        }
        .pdf-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 16px;
        }
        .pdf-body th, .pdf-body td {
          border: 1px solid #D4D4DA;
          padding: 8px 12px;
          text-align: left;
          font-size: 14px;
        }
        .pdf-body th {
          background: #F0FFF4;
          color: #1B4332;
          font-weight: 600;
        }
        .pdf-body img { max-width: 100%; border-radius: 8px; }
        .pdf-body .katex { font-size: 1.05em; }
        .pdf-footer {
          margin-top: 40px;
          padding-top: 14px;
          border-top: 1px solid #ECECEF;
          font-size: 10px;
          color: #B5B5BD;
          text-align: center;
        }
        .pdf-footer .made {
          display: block;
          margin-top: 2px;
          font-weight: 600;
          color: #8E8E96;
        }
      </style>

      <div class="pdf-header">
        <div class="pdf-logo">G</div>
        <span class="pdf-brand">GRID</span>
      </div>

      <h1 class="pdf-title">${chapterName || note.title}</h1>

      <div class="pdf-body">${renderedHTML}</div>

      <div class="pdf-footer">
        <span>GRID - Gathering Resources In Detail</span>
        <span class="made">Made by Sabari Krishnan</span>
      </div>
    `;

    container.style.background = '#ffffff';
    container.style.color = '#1A1A2E';

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${note.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    };

    html2pdf().set(opt).from(container).save();
  }

  return { generatePDF };
})();
