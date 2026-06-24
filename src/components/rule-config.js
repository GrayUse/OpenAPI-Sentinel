/**
 * Rule Configuration Panel
 * Manage linting rules — toggle severity, enable/disable rules.
 */

const RULE_GROUPS = [
  {
    title: 'Stoplight Compatible (Spectral)',
    rules: [
      { id: 'operation-description', desc: 'Operations should have a description', default: 'warn' },
      { id: 'parameter-description', desc: 'Parameter objects must have a description', default: 'warn' },
      { id: 'no-server-example.com', desc: 'Server URL must not point at example.com', default: 'warn' },
      { id: 'operation-operationId', desc: 'Each operation must have a unique operationId', default: 'warn' },
      { id: 'operation-2xx-response', desc: 'Every operation needs at least one 2xx response', default: 'warn' },
      { id: 'info-contact', desc: 'API should have contact info', default: 'info' },
      { id: 'info-license', desc: 'API should have a license', default: 'info' },
    ],
  },
  {
    title: 'Strict Mode Additions (Redocly)',
    rules: [
      { id: 'security-defined', desc: 'API must define a security scheme', default: 'off' },
      { id: 'operation-security-defined', desc: 'Each operation should define security', default: 'off' },
      { id: 'operation-4xx-response', desc: 'Operation must have at least one 4XX response', default: 'off' },
      { id: 'no-empty-servers', desc: 'Ensure servers array is not empty', default: 'off' },
      { id: 'no-server-trailing-slash', desc: 'Server URLs must not have trailing slashes', default: 'error' },
      { id: 'no-undefined-server-variable', desc: 'All server variables must be defined', default: 'error' },
      { id: 'spec-strict-refs', desc: 'Ensure $ref values are valid', default: 'error' },
      { id: 'no-enum-type-mismatch', desc: 'Enum values must match the declared type', default: 'error' },
    ],
  },
];

let ruleConfig = { extends: 'recommended' };

export function initRulesPanel() {
  // Initialize defaults
  RULE_GROUPS.forEach((group) => {
    group.rules.forEach((rule) => {
      if (ruleConfig[rule.id] === undefined) {
        ruleConfig[rule.id] = rule.default;
      }
    });
  });

  renderRulesPanel();
}

function renderRulesPanel() {
  const container = document.getElementById('rules-container');

  container.innerHTML = `
    <div class="rules-header">
      <h2>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;opacity:0.6">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="7" cy="6" r="2" fill="currentColor"/>
          <circle cx="15" cy="12" r="2" fill="currentColor"/>
          <circle cx="10" cy="18" r="2" fill="currentColor"/>
        </svg>
        Linting Rules
      </h2>
      <p>Configure which rules to apply when validating your OpenAPI specification. Changes take effect on the next lint run.</p>
    </div>

    <div style="display:flex; gap:16px; align-items:center; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #252a3a;">
      <label style="font-weight:600; font-size:13px; color:#e8eaf0;">Base Preset (Extends):</label>
      <select id="base-preset-select" style="background:#181c28; color:#e8eaf0; border:1px solid #2d3348; border-radius:4px; padding:6px 12px; font-size:13px;">
        <option value="recommended" ${ruleConfig.extends === 'recommended' ? 'selected' : ''}>Recommended (Latest)</option>
        <option value="recommended-strict" ${ruleConfig.extends === 'recommended-strict' ? 'selected' : ''}>Recommended Strict</option>
        <option value="minimal" ${ruleConfig.extends === 'minimal' ? 'selected' : ''}>Minimal</option>
        <option value="all" ${ruleConfig.extends === 'all' ? 'selected' : ''}>All Rules</option>
      </select>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:24px">
      <span style="font-size:12px; color:#8b90a5; line-height:30px; margin-right:8px;">Quick Overrides:</span>
      <button class="btn btn-ghost" id="btn-rules-strict">All Errors</button>
      <button class="btn btn-ghost" id="btn-rules-recommended">Reset Defaults</button>
      <button class="btn btn-ghost" id="btn-rules-minimal">Disable All</button>
    </div>

    ${RULE_GROUPS.map((group) => `
      <div class="rule-group">
        <div class="rule-group-title">
          ${group.title}
          <span class="count">${group.rules.length}</span>
        </div>
        ${group.rules.map((rule) => `
          <div class="rule-card">
            <span class="rule-name">${rule.id}</span>
            <span class="rule-desc">${rule.desc}</span>
            <select data-rule="${rule.id}">
              <option value="off" ${ruleConfig[rule.id] === 'off' ? 'selected' : ''}>Off</option>
              <option value="info" ${ruleConfig[rule.id] === 'info' ? 'selected' : ''}>Info</option>
              <option value="warn" ${ruleConfig[rule.id] === 'warn' ? 'selected' : ''}>Warn</option>
              <option value="error" ${ruleConfig[rule.id] === 'error' ? 'selected' : ''}>Error</option>
            </select>
          </div>
        `).join('')}
      </div>
    `).join('')}
  `;

  // Bind select changes
  container.querySelectorAll('select[data-rule]').forEach((select) => {
    select.addEventListener('change', (e) => {
      ruleConfig[e.target.dataset.rule] = e.target.value;
    });
  });

  const baseSelect = document.getElementById('base-preset-select');
  if (baseSelect) {
    baseSelect.addEventListener('change', (e) => {
      ruleConfig.extends = e.target.value;
    });
  }

  // Preset buttons
  document.getElementById('btn-rules-strict')?.addEventListener('click', () => {
    applyPreset('error');
  });
  document.getElementById('btn-rules-recommended')?.addEventListener('click', () => {
    applyPreset(null); // Use defaults
  });
  document.getElementById('btn-rules-minimal')?.addEventListener('click', () => {
    applyPreset('off', ['spec-strict-refs', 'no-enum-type-mismatch']);
  });
}

function applyPreset(level, keepErrorIds = []) {
  RULE_GROUPS.forEach((group) => {
    group.rules.forEach((rule) => {
      if (level === null) {
        ruleConfig[rule.id] = rule.default;
      } else if (keepErrorIds.includes(rule.id)) {
        ruleConfig[rule.id] = 'error';
      } else {
        ruleConfig[rule.id] = level;
      }
    });
  });
  renderRulesPanel();
  window.__showToast?.('Rule preset applied', 'info');
}

/**
 * Export current rule config for use in lint requests.
 */
export function getRuleConfig() {
  const rules = {};
  for (const [key, value] of Object.entries(ruleConfig)) {
    if (key !== 'extends') {
      rules[key] = value;
    }
  }
  return {
    extends: ruleConfig.extends,
    rules
  };
}
