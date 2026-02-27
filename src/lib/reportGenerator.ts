'use client';

/**
 * Triggers browser print dialog scoped to the report element only.
 * This is far more reliable than html2canvas because:
 *  - Chart.js <canvas> elements render correctly
 *  - Plotly SVG renders correctly
 *  - No CORS / cross-origin issues
 *  - Works offline, no extra deps
 */
export function downloadStudentReport(elementId: string, _studentName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = document.getElementById(elementId);
    if (!element) {
      reject(new Error('Report element not found'));
      return;
    }

    const printContents = element.innerHTML;

    // Collect all stylesheets from the page so Tailwind classes print correctly
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => l.outerHTML)
      .join('\n');

    const styleBlocks = Array.from(document.querySelectorAll('style'))
      .map((s) => `<style>${s.innerHTML}</style>`)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      reject(new Error('Popup blocked. Allow popups and try again.'));
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>AcadPulse Report</title>
          ${styleLinks}
          ${styleBlocks}
          <style>
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { margin: 0; padding: 0; background: white; }
            @page { margin: 10mm; size: A4 portrait; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 800);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    resolve();
  });
}
