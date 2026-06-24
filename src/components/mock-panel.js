/**
 * Mock Server Control Panel
 * Start/stop mock server, view endpoints, test them, and see request logs.
 */

let mockState = {
  running: false,
  endpoints: [],
  logs: [],
};

let getSpecContent = null;

export function initMockPanel(getSpecFn) {
  getSpecContent = getSpecFn;
  renderMockPanel();
}

function renderMockPanel() {
  const container = document.getElementById('mock-container');

  container.innerHTML = `
    <div class="mock-header">
      <h2>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;opacity:0.6">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Mock Server
      </h2>
      <div class="mock-status">
        <span class="status-item">
          <span class="status-dot ${mockState.running ? 'success' : 'idle'}"></span>
          ${mockState.running ? 'Running' : 'Stopped'}
        </span>
        ${mockState.running
          ? '<button class="btn btn-danger" id="btn-mock-stop">Stop</button>'
          : '<button class="btn btn-success" id="btn-mock-start">Start Mock Server</button>'
        }
      </div>
    </div>

    ${mockState.running && mockState.endpoints.length > 0 ? `
      <div class="mock-endpoint-list">
        ${mockState.endpoints.map((ep) => `
          <div class="mock-endpoint" data-method="${ep.method.toLowerCase()}" data-path="${ep.path}">
            <span class="method-badge ${ep.method.toLowerCase()}">${ep.method}</span>
            <span class="endpoint-path">${ep.path}</span>
            <span class="endpoint-summary">${ep.summary || ''}</span>
            <button class="btn btn-ghost btn-test-endpoint" title="Test this endpoint">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5z" fill="currentColor"/></svg>
            </button>
          </div>
        `).join('')}
      </div>

      <div class="mock-response-preview" id="mock-response-area" style="display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:var(--fs-sm);font-weight:600;color:var(--c-text-secondary)">Response Preview</span>
          <button class="btn btn-ghost" id="btn-close-response" style="padding:4px 8px;font-size:var(--fs-xs)">Close</button>
        </div>
        <pre id="mock-response-body"></pre>
      </div>

      <div class="mock-log">
        <h3>Request Log</h3>
        <div class="mock-log-list" id="mock-log-list">
          ${mockState.logs.length === 0
            ? '<div style="color:var(--c-text-tertiary);font-size:var(--fs-sm);padding:8px">No requests yet — click an endpoint to test it</div>'
            : mockState.logs.map((log) => `
              <div class="mock-log-entry">
                <span class="timestamp">${log.time}</span>
                <span class="method-badge ${log.method.toLowerCase()}" style="font-size:10px;padding:1px 6px;min-width:40px">${log.method}</span>
                <span style="flex:1">${log.path}</span>
                <span class="status-code s${Math.floor(log.status / 100)}xx">${log.status}</span>
              </div>
            `).join('')
          }
        </div>
      </div>
    ` : !mockState.running ? `
      <div class="empty-state" style="height:300px">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <path d="M18 14l16 10-16 10z" fill="currentColor" opacity="0.15"/>
        </svg>
        <p>Start the mock server to simulate your API endpoints.<br>
        Responses are auto-generated from your OpenAPI schemas.</p>
      </div>
    ` : ''}
  `;

  // Bind events
  const startBtn = document.getElementById('btn-mock-start');
  const stopBtn = document.getElementById('btn-mock-stop');

  startBtn?.addEventListener('click', startMock);
  stopBtn?.addEventListener('click', stopMock);

  // Test endpoint buttons
  container.querySelectorAll('.btn-test-endpoint').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const endpointEl = btn.closest('.mock-endpoint');
      const method = endpointEl.dataset.method;
      const path = endpointEl.dataset.path;
      testEndpoint(method, path);
    });
  });

  // Also clicking the endpoint row itself
  container.querySelectorAll('.mock-endpoint').forEach((el) => {
    el.addEventListener('click', () => {
      const method = el.dataset.method;
      const path = el.dataset.path;
      testEndpoint(method, path);
    });
  });

  document.getElementById('btn-close-response')?.addEventListener('click', () => {
    document.getElementById('mock-response-area').style.display = 'none';
  });
}

async function startMock() {
  const spec = getSpecContent?.();
  if (!spec) {
    window.__showToast?.('No spec loaded', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/mock/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec }),
    });
    const data = await res.json();

    if (data.error) {
      window.__showToast?.(data.error, 'error');
      return;
    }

    mockState.running = true;
    mockState.endpoints = data.endpoints || [];
    mockState.logs = [];

    window.__showToast?.(`Mock server started — ${mockState.endpoints.length} endpoints`, 'success');
    renderMockPanel();
  } catch (err) {
    window.__showToast?.('Failed to start mock server', 'error');
  }
}

async function stopMock() {
  try {
    await fetch('/api/mock/stop', { method: 'POST' });
    mockState.running = false;
    mockState.endpoints = [];
    mockState.logs = [];
    window.__showToast?.('Mock server stopped', 'info');
    renderMockPanel();
  } catch (err) {
    window.__showToast?.('Failed to stop mock server', 'error');
  }
}

async function testEndpoint(method, path) {
  // Replace path params with sample values
  const testPath = path.replace(/\{([^}]+)\}/g, 'test-id');
  const url = `/api/mock/proxy${testPath}`;

  try {
    const res = await fetch(url, { method: method.toUpperCase() });
    const body = await res.json();

    // Add to log
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    mockState.logs.unshift({
      time,
      method: method.toUpperCase(),
      path: testPath,
      status: res.status,
    });

    // Keep last 50 logs
    if (mockState.logs.length > 50) mockState.logs = mockState.logs.slice(0, 50);

    renderMockPanel();

    // Show response
    const responseArea = document.getElementById('mock-response-area');
    const responseBody = document.getElementById('mock-response-body');
    if (responseArea && responseBody) {
      responseArea.style.display = 'block';
      responseBody.textContent = JSON.stringify(body, null, 2);
    }
  } catch (err) {
    window.__showToast?.(`Request failed: ${err.message}`, 'error');
  }
}
