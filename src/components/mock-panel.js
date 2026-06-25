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

      <div class="mock-response-preview" id="mock-response-area" style="display:${mockState.currentResponse ? 'block' : 'none'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:var(--fs-sm);font-weight:600;color:var(--c-text-secondary)">Response Preview</span>
          <button class="btn btn-ghost" id="btn-close-response" style="padding:4px 8px;font-size:var(--fs-xs)">Close</button>
        </div>
        <pre id="mock-response-body">${mockState.currentResponse ? escapeHtml(JSON.stringify(mockState.currentResponse, null, 2)) : ''}</pre>
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
    mockState.currentResponse = null;
    renderMockPanel();
  });
}

async function startMock() {
  const spec = getSpecContent?.();
  if (!spec) {
    window.__showToast?.('No spec loaded', 'warning');
    return;
  }

  try {
    const { default: YAML } = await import('yaml');
    const doc = YAML.parse(spec);
    
    mockState.running = true;
    mockState.endpoints = [];
    mockState.logs = [];

    const paths = doc.paths || {};
    for (const path in paths) {
      for (const method in paths[path]) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options'].includes(method.toLowerCase())) {
          mockState.endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: paths[path][method].summary || ''
          });
        }
      }
    }

    // Attempt to store the dereferenced spec if possible, or fallback to YAML AST
    // We can rely on Redocly's dereferencing if we tap into the current lint state, but 
    // for simplicity, we can just use the raw doc + components.
    mockState.specObj = doc;

    window.__showToast?.(`Mock server started locally — ${mockState.endpoints.length} endpoints`, 'success');
    renderMockPanel();
  } catch (err) {
    window.__showToast?.('Failed to start mock server', 'error');
  }
}

async function stopMock() {
  mockState.running = false;
  mockState.endpoints = [];
  mockState.logs = [];
  window.__showToast?.('Mock server stopped', 'info');
  renderMockPanel();
}

async function testEndpoint(method, path) {
  // Try to generate a fake response
  try {
    const { JSONSchemaFaker } = await import('json-schema-faker');
    JSONSchemaFaker.option('useExamplesValue', true);
    JSONSchemaFaker.option('alwaysFakeOptionals', true);

    const doc = mockState.specObj;
    const operation = doc.paths[path]?.[method.toLowerCase()];
    if (!operation) throw new Error('Operation not found');

    const responses = operation.responses || {};
    const successRes = responses['200'] || responses['201'] || responses['default'] || Object.values(responses)[0];
    
    let schema = null;
    let body = null;
    
    if (successRes && successRes.content && successRes.content['application/json']) {
      schema = successRes.content['application/json'].schema;
    }

    if (!schema) {
      body = { _mock_status: 'No JSON schema found to mock.' };
    } else {
      // Create a bundled schema with components to resolve refs locally if JSONSchemaFaker supports it,
      // or rely on its built-in ref resolution if we pass the whole doc as components.
      const fakeSchema = { ...schema, components: doc.components };
      
      try {
        body = await JSONSchemaFaker.resolve(fakeSchema);
      } catch (e) {
        // Fallback synchronous generation if async fails
        body = JSONSchemaFaker.generate(schema);
      }
    }

    // Log the request
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const testPath = path.replace(/\{([^}]+)\}/g, 'test-id');

    mockState.logs.unshift({
      time,
      method: method.toUpperCase(),
      path: testPath,
      status: 200,
    });

    if (mockState.logs.length > 50) mockState.logs = mockState.logs.slice(0, 50);
    
    mockState.currentResponse = body;
    renderMockPanel();
    
    window.__showToast?.('Mock generated successfully', 'success');
  } catch (err) {
    console.error(err);
    window.__showToast?.('Mock generation failed: ' + err.message, 'error');
  }
}
