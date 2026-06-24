/**
 * Docs Preview Component
 * Renders API documentation using Scalar API Reference.
 */

let currentScalar = null;

export function renderDocsPreview(specContent) {
  const container = document.getElementById('docs-container');

  if (!specContent || specContent.trim().length < 10) {
    container.innerHTML = `
      <div class="docs-placeholder">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M9 6h21l9 9v27a3 3 0 01-3 3H9a3 3 0 01-3-3V9a3 3 0 013-3z" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <path d="M30 6v12h12" stroke="currentColor" stroke-width="2" opacity="0.3"/>
        </svg>
        <p>Load an OpenAPI spec to see the documentation preview</p>
      </div>
    `;
    return;
  }

  // Render using Scalar API Reference embedded via CDN
  container.innerHTML = `
    <div id="scalar-ref" style="width:100%;height:100%;">
      <div class="empty-state" style="height:100%">
        <div class="skeleton" style="width:60%;height:20px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:80%;height:14px;margin-bottom:6px"></div>
        <div class="skeleton" style="width:70%;height:14px"></div>
        <p style="margin-top:16px;color:var(--c-text-tertiary);font-size:var(--fs-sm)">Loading documentation preview...</p>
      </div>
    </div>
  `;

  // Use Scalar's CDN-based approach
  renderWithScalar(specContent, container);
}

async function renderWithScalar(specContent, container) {
  try {
    // Encode the spec content as a data URL for Scalar
    const isJson = specContent.trimStart().startsWith('{');
    const mimeType = isJson ? 'application/json' : 'application/x-yaml';
    const blob = new Blob([specContent], { type: mimeType });
    const dataUrl = URL.createObjectURL(blob);

    // Build an iframe with Scalar API Reference
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      background: #0c0e14;
      color: #e8eaf0;
    }
    /* Override Scalar theme to match our dark theme */
    .scalar-app {
      --scalar-background-1: #0c0e14 !important;
      --scalar-background-2: #12151e !important;
      --scalar-background-3: #181c28 !important;
      --scalar-border-color: rgba(255,255,255,0.06) !important;
      --scalar-color-1: #e8eaf0 !important;
      --scalar-color-2: #8b90a5 !important;
      --scalar-color-3: #5c6078 !important;
      --scalar-color-accent: #6366f1 !important;
    }
  </style>
</head>
<body>
  <script id="api-reference" data-url="${dataUrl}" data-proxy-url=""></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

    const iframeBlob = new Blob([html], { type: 'text/html' });
    const iframeUrl = URL.createObjectURL(iframeBlob);

    container.innerHTML = `
      <iframe
        id="docs-iframe"
        src="${iframeUrl}"
        style="width:100%;height:100%;border:none;background:#0c0e14;"
        sandbox="allow-scripts allow-same-origin allow-popups"
      ></iframe>
    `;

    // Cleanup old URLs
    if (currentScalar) {
      URL.revokeObjectURL(currentScalar);
    }
    currentScalar = iframeUrl;
  } catch (err) {
    console.error('[docs]', err);
    container.innerHTML = `
      <div class="docs-placeholder">
        <p style="color:var(--c-error)">Failed to render documentation: ${err.message}</p>
      </div>
    `;
  }
}
