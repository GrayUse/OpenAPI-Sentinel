/**
 * Problems Panel Component
 * Displays linting diagnostics grouped by severity.
 */

let toggleState = true; // false = collapsed

export function renderProblems(diagnostics, stats, onClickProblem) {
  const statsEl = document.getElementById('problems-stats');
  const bodyEl = document.getElementById('problems-body');
  const panelEl = document.getElementById('problems-panel');
  const headerEl = document.getElementById('problems-header');
  const toggleEl = document.getElementById('problems-toggle');

  // Update stats
  statsEl.innerHTML = `
    <span class="stat"><span class="stat-dot error"></span> ${stats.errors}</span>
    <span class="stat"><span class="stat-dot warning"></span> ${stats.warnings}</span>
    <span class="stat"><span class="stat-dot info"></span> ${stats.infos}</span>
  `;

  // Auto-expand if there are errors
  if (stats.errors > 0 && panelEl.classList.contains('collapsed')) {
    panelEl.classList.remove('collapsed');
    toggleState = true;
  }

  // Sort: errors first, then warnings, then info
  const severityOrder = { error: 0, warning: 1, info: 2 };
  const sorted = [...diagnostics].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  if (sorted.length === 0) {
    bodyEl.innerHTML = `
      <div class="empty-state" style="height:auto;padding:24px">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <path d="M11 16l3 3 7-7" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p style="color:var(--c-success);font-size:var(--fs-sm)">No issues found — your spec looks great!</p>
      </div>
    `;
    return;
  }

  bodyEl.innerHTML = sorted
    .map(
      (d, i) => `
    <div class="problem-item fade-in" style="animation-delay:${i * 30}ms" data-line="${d.location.startLine}">
      <span class="problem-icon ${d.severity}">${severityIcon(d.severity)}</span>
      <span class="problem-message">${escapeHtml(d.message)}</span>
      <span class="problem-rule">${d.ruleId}</span>
      <span class="problem-location">Ln ${d.location.startLine}</span>
    </div>
  `
    )
    .join('');

  // Click handler — jump to line
  bodyEl.querySelectorAll('.problem-item').forEach((item) => {
    item.addEventListener('click', () => {
      const line = parseInt(item.dataset.line, 10);
      if (line && onClickProblem) {
        onClickProblem(line);
      }
    });
  });

  // Toggle header
  headerEl.onclick = () => {
    toggleState = !toggleState;
    panelEl.classList.toggle('collapsed', !toggleState);
  };
}

function severityIcon(severity) {
  switch (severity) {
    case 'error':
      return '✕';
    case 'warning':
      return '!';
    default:
      return 'i';
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
