/**
 * Form Editor Component
 * Provides a lightweight GUI for editing OpenAPI Info and Paths.
 * Uses 'yaml' library to safely mutate AST and preserve comments.
 */

export let isFormFocused = false;
let updateContentCallback = null;
let currentYaml = '';

export function initFormEditor(onUpdateContent) {
  updateContentCallback = onUpdateContent;
}

export async function renderFormEditor(yamlContent) {
  currentYaml = yamlContent;
  const container = document.getElementById('form-container');
  
  if (!yamlContent || !yamlContent.trim()) {
    container.innerHTML = '<div style="opacity:0.5; text-align:center; padding: 40px;">No spec loaded.</div>';
    return;
  }

  try {
    const { default: YAML } = await import('yaml');
    const doc = YAML.parseDocument(yamlContent);
    const spec = doc.toJSON() || {};

    let html = '';

    // --- Info Section ---
    html += `
      <div class="form-section" id="form-node-info" data-yaml-path="info" style="background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin-top: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          API Info
        </h2>
        
        <div style="display: grid; gap: 16px;">
          <div>
            <label style="display:block; margin-bottom: 6px; font-size: 0.85rem; opacity: 0.8;">Title</label>
            <input type="text" class="form-input" data-path="info.title" value="${escapeHtml(spec.info?.title || '')}" style="width: 100%; padding: 8px 12px; background: var(--c-bg-surface); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit;">
          </div>
          <div>
            <label style="display:block; margin-bottom: 6px; font-size: 0.85rem; opacity: 0.8;">Version</label>
            <input type="text" class="form-input" data-path="info.version" value="${escapeHtml(spec.info?.version || '')}" style="width: 100%; padding: 8px 12px; background: var(--c-bg-surface); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit;">
          </div>
          <div>
            <label style="display:block; margin-bottom: 6px; font-size: 0.85rem; opacity: 0.8;">Description</label>
            <textarea class="form-input" data-path="info.description" rows="3" style="width: 100%; padding: 8px 12px; background: var(--c-bg-surface); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit; resize: vertical;">${escapeHtml(spec.info?.description || '')}</textarea>
          </div>
        </div>
      </div>
    `;

    // --- Paths Section ---
    if (spec.paths && Object.keys(spec.paths).length > 0) {
      html += `
        <div class="form-section" style="background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 8px; padding: 20px;">
          <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 1.2rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M6 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Paths
            </div>
            <button class="btn btn-ghost form-action" data-action="add-path" style="font-size: 0.8rem; padding: 4px 8px;">+ Add Path</button>
          </h2>
          <div style="display: grid; gap: 24px;">
      `;

      for (const [pathName, pathObj] of Object.entries(spec.paths)) {
        html += `<div style="border-left: 2px solid var(--c-accent); padding-left: 16px;" class="form-node-path" data-path-name="${escapeHtml(pathName)}">`;
        html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                   <h3 style="font-family: var(--ff-mono); margin: 0; font-size: 1.05rem;">${escapeHtml(pathName)}</h3>
                   <button class="btn btn-ghost form-action" data-action="add-op" data-path="paths['${pathName}']" style="font-size: 0.75rem; padding: 2px 6px;">+ Add Method</button>
                 </div>`;
        
        for (const [method, op] of Object.entries(pathObj)) {
          if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) continue;
          
          const methodColors = {
            get: '#3b82f6', post: '#10b981', put: '#f59e0b', delete: '#ef4444', patch: '#8b5cf6'
          };
          const color = methodColors[method] || '#9ca3af';

          html += `
            <div class="form-node-operation" data-path-name="${escapeHtml(pathName)}" data-method="${method}" style="margin-bottom: 20px; background: var(--c-bg-surface); border: 1px solid var(--c-border); border-radius: 6px; overflow: hidden;">
              <!-- Header -->
              <div style="padding: 10px 14px; border-bottom: 1px solid var(--c-border); display: flex; align-items: center; justify-content: space-between; background: ${color}10;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: ${color}20; color: ${color}; font-weight: bold; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">${method}</span>
                  <span style="font-size: 0.85rem; font-weight: 500; opacity: 0.9;">Operation ID: </span>
                  <input type="text" class="form-input" data-path="paths['${pathName}'].${method}.operationId" value="${escapeHtml(op.operationId || '')}" style="background: transparent; border: 1px solid transparent; border-bottom: 1px solid var(--c-border); color: var(--c-text-primary); font-size: 0.85rem; padding: 2px 4px; outline: none; width: 150px;">
                </div>
                <button class="btn btn-ghost form-action" data-action="delete-op" data-path="paths['${pathName}'].${method}" style="color: var(--c-error); padding: 4px 8px;">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
              
              <div style="padding: 16px; display: grid; gap: 16px;">
                <!-- Summary & Description -->
                <div style="display: grid; gap: 12px;">
                  <div>
                    <label style="display:block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 500; opacity: 0.8;">Summary</label>
                    <input type="text" class="form-input" data-path="paths['${pathName}'].${method}.summary" value="${escapeHtml(op.summary || '')}" style="width: 100%; padding: 6px 10px; background: var(--c-bg-raised); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit; font-size: 0.9rem;">
                  </div>
                  <div>
                    <label style="display:block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 500; opacity: 0.8;">Description</label>
                    <textarea class="form-input" data-path="paths['${pathName}'].${method}.description" rows="2" style="width: 100%; padding: 6px 10px; background: var(--c-bg-raised); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit; font-size: 0.9rem; resize: vertical;">${escapeHtml(op.description || '')}</textarea>
                  </div>
                </div>

                <!-- Parameters -->
                <div style="border-top: 1px solid var(--c-border); padding-top: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <label style="font-size: 0.85rem; font-weight: 600;">Parameters</label>
                    <button class="btn btn-ghost form-action" data-action="add-param" data-path="paths['${pathName}'].${method}.parameters" style="font-size: 0.75rem; padding: 2px 6px;">+ Add</button>
                  </div>
                  <div style="display: grid; gap: 8px;">
                    ${(op.parameters || []).map((param, i) => `
                      <div style="display: flex; gap: 8px; align-items: center; background: var(--c-bg-raised); padding: 8px; border-radius: 4px; border: 1px solid var(--c-border);">
                        <input type="text" class="form-input" data-path="paths['${pathName}'].${method}.parameters[${i}].name" value="${escapeHtml(param.name || '')}" placeholder="Name" style="flex: 2; min-width: 60px; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary);">
                        <select class="form-input" data-path="paths['${pathName}'].${method}.parameters[${i}].in" style="flex: 1; min-width: 80px; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary);">
                          <option value="query" ${param.in === 'query' ? 'selected' : ''}>query</option>
                          <option value="path" ${param.in === 'path' ? 'selected' : ''}>path</option>
                          <option value="header" ${param.in === 'header' ? 'selected' : ''}>header</option>
                        </select>
                        <label style="flex: 1; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; opacity: 0.8; white-space: nowrap;">
                          <input type="checkbox" class="form-input" data-path="paths['${pathName}'].${method}.parameters[${i}].required" ${param.required ? 'checked' : ''}>
                          Required
                        </label>
                        <button class="btn btn-ghost form-action" data-action="delete-item" data-path="paths['${pathName}'].${method}.parameters[${i}]" style="color: var(--c-error); padding: 4px;">
                           <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                      </div>
                    `).join('')}
                    ${(!op.parameters || op.parameters.length === 0) ? '<div style="font-size: 0.8rem; opacity: 0.5; font-style: italic;">No parameters</div>' : ''}
                  </div>
                </div>

                <!-- Request Body -->
                ${(['post', 'put', 'patch'].includes(method) || op.requestBody) ? `
                <div style="border-top: 1px solid var(--c-border); padding-top: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <label style="font-size: 0.85rem; font-weight: 600;">Request Body</label>
                  </div>
                  <div style="display: grid; gap: 8px;">
                    <div style="display: flex; gap: 8px; flex-direction: column; background: var(--c-bg-raised); padding: 8px; border-radius: 4px; border: 1px solid var(--c-border);">
                      <textarea class="form-input" data-path="paths['${pathName}'].${method}.requestBody.description" rows="1" placeholder="Request body description..." style="width: 100%; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); resize: vertical; font-size: 0.85rem;">${escapeHtml(op.requestBody?.description || '')}</textarea>
                      <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; opacity: 0.8;">
                        <input type="checkbox" class="form-input" data-path="paths['${pathName}'].${method}.requestBody.required" ${op.requestBody?.required ? 'checked' : ''}>
                        Required
                      </label>
                      
                      <div style="margin-top: 4px; border-top: 1px dashed var(--c-border); padding-top: 8px;">
                        <label style="font-size: 0.75rem; font-weight: 600; opacity: 0.8; margin-bottom: 6px; display: block;">Schema (application/json)</label>
                        ${(function() {
                          const reqSchema = op.requestBody?.content?.['application/json']?.schema || {};
                          const reqRef = reqSchema.$ref;
                          const reqProps = reqSchema.properties || {};
                          
                          if (reqRef || Object.keys(reqSchema).length === 0) {
                            return `
                              <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="font-size: 0.8rem; opacity: 0.7; font-family: var(--ff-mono);">$ref:</span>
                                <input type="text" class="form-input" data-path="paths['${pathName}'].${method}.requestBody.content['application/json'].schema.$ref" value="${escapeHtml(reqRef || '')}" placeholder="#/components/schemas/ModelName" style="flex: 1; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: var(--ff-mono); font-size: 0.8rem;">
                              </div>
                            `;
                          } else {
                            return `
                              <div style="display: grid; gap: 4px;">
                                ${Object.entries(reqProps).map(([pName, pObj]) => `
                                  <div style="display: flex; gap: 8px; align-items: center; font-size: 0.8rem; padding: 4px; background: rgba(0,0,0,0.1); border-radius: 4px;">
                                    <span style="font-family: var(--ff-mono); width: 100px; font-weight: bold;">${escapeHtml(pName)}</span>
                                    <span style="color: var(--c-text-secondary); opacity: 0.8;">${escapeHtml(pObj.type || 'string')}</span>
                                  </div>
                                `).join('')}
                                ${Object.keys(reqProps).length === 0 ? '<div style="font-size: 0.75rem; opacity: 0.5;">No properties defined inline. Add them in YAML.</div>' : ''}
                              </div>
                            `;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                ` : ''}

                <!-- Responses -->
                <div style="border-top: 1px solid var(--c-border); padding-top: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <label style="font-size: 0.85rem; font-weight: 600;">Responses</label>
                    <button class="btn btn-ghost form-action" data-action="add-response" data-path="paths['${pathName}'].${method}.responses" style="font-size: 0.75rem; padding: 2px 6px;">+ Add</button>
                  </div>
                  <div style="display: grid; gap: 8px;">
                    ${Object.entries(op.responses || {}).map(([code, res]) => `
                      <div style="display: flex; gap: 8px; align-items: flex-start; background: var(--c-bg-raised); padding: 8px; border-radius: 4px; border: 1px solid var(--c-border);">
                        <div style="font-family: var(--ff-mono); font-size: 0.85rem; font-weight: bold; color: ${code.startsWith('2') ? 'var(--c-success)' : code.startsWith('4') ? 'var(--c-error)' : 'var(--c-text-primary)'}; width: 40px; padding-top: 4px;">${escapeHtml(code)}</div>
                        <textarea class="form-input" data-path="paths['${pathName}'].${method}.responses['${code}'].description" rows="1" placeholder="Description" style="flex: 1; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); resize: vertical; font-size: 0.85rem;">${escapeHtml(res.description || '')}</textarea>
                        <button class="btn btn-ghost form-action" data-action="delete-item" data-path="paths['${pathName}'].${method}.responses['${code}']" style="color: var(--c-error); padding: 4px;">
                           <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                      </div>
                    `).join('')}
                    ${(!op.responses || Object.keys(op.responses).length === 0) ? '<div style="font-size: 0.8rem; opacity: 0.5; font-style: italic;">No responses</div>' : ''}
                  </div>
                </div>

              </div>
            </div>
          `;
        }
        html += `</div>`;
      }
      html += `</div></div>`;
    }

    // --- Schemas Section ---
    const schemasObj = spec.components?.schemas || {};
    html += `
      <div class="form-section" style="background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 8px; padding: 20px; margin-top: 24px;">
        <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 1.2rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 7h10M7 3v10" stroke="currentColor" stroke-width="1.5"/></svg>
            Models (Schemas)
          </div>
          <button class="btn btn-ghost form-action" data-action="add-schema" style="font-size: 0.8rem; padding: 4px 8px;">+ Add Model</button>
        </h2>
        <div style="display: grid; gap: 24px;">
    `;

    for (const [schemaName, schemaObj] of Object.entries(schemasObj)) {
      html += `
        <div class="form-node-schema" data-schema-name="${escapeHtml(schemaName)}" style="background: var(--c-bg-surface); border: 1px solid var(--c-border); border-radius: 6px; overflow: hidden;">
          <!-- Header -->
          <div style="padding: 10px 14px; border-bottom: 1px solid var(--c-border); display: flex; align-items: center; justify-content: space-between; background: var(--c-bg-raised);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-family: var(--ff-mono); font-size: 1.05rem; font-weight: bold; color: var(--c-text-primary);">${escapeHtml(schemaName)}</span>
              <span style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">${escapeHtml(schemaObj.type || 'object')}</span>
            </div>
            <button class="btn btn-ghost form-action" data-action="delete-item" data-path="components.schemas['${schemaName}']" style="color: var(--c-error); padding: 4px 8px;">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          
          <div style="padding: 16px; display: grid; gap: 16px;">
            <!-- Description -->
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 500; opacity: 0.8;">Description</label>
              <textarea class="form-input" data-path="components.schemas['${schemaName}'].description" rows="1" style="width: 100%; padding: 6px 10px; background: var(--c-bg-raised); border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary); font-family: inherit; font-size: 0.9rem; resize: vertical;">${escapeHtml(schemaObj.description || '')}</textarea>
            </div>

            <!-- Properties -->
            <div style="border-top: 1px solid var(--c-border); padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-size: 0.85rem; font-weight: 600;">Properties</label>
                <button class="btn btn-ghost form-action" data-action="add-schema-prop" data-path="components.schemas['${schemaName}'].properties" style="font-size: 0.75rem; padding: 2px 6px;">+ Add Property</button>
              </div>
              <div style="display: grid; gap: 8px;">
                ${Object.entries(schemaObj.properties || {}).map(([propName, propObj]) => `
                  <div style="display: flex; gap: 8px; align-items: center; background: var(--c-bg-raised); padding: 8px; border-radius: 4px; border: 1px solid var(--c-border);">
                    <div style="font-family: var(--ff-mono); font-size: 0.85rem; font-weight: 600; width: 120px; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(propName)}">${escapeHtml(propName)}</div>
                    <select class="form-input" data-path="components.schemas['${schemaName}'].properties['${propName}'].type" style="flex: 1; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary);">
                      <option value="string" ${propObj.type === 'string' ? 'selected' : ''}>string</option>
                      <option value="integer" ${propObj.type === 'integer' ? 'selected' : ''}>integer</option>
                      <option value="number" ${propObj.type === 'number' ? 'selected' : ''}>number</option>
                      <option value="boolean" ${propObj.type === 'boolean' ? 'selected' : ''}>boolean</option>
                      <option value="object" ${propObj.type === 'object' ? 'selected' : ''}>object</option>
                      <option value="array" ${propObj.type === 'array' ? 'selected' : ''}>array</option>
                    </select>
                    <input type="text" class="form-input" data-path="components.schemas['${schemaName}'].properties['${propName}'].description" value="${escapeHtml(propObj.description || '')}" placeholder="Description" style="flex: 2; padding: 4px 8px; background: transparent; border: 1px solid var(--c-border); border-radius: 4px; color: var(--c-text-primary);">
                    <button class="btn btn-ghost form-action" data-action="delete-item" data-path="components.schemas['${schemaName}'].properties['${propName}']" style="color: var(--c-error); padding: 4px;">
                       <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                `).join('')}
                ${(!schemaObj.properties || Object.keys(schemaObj.properties).length === 0) ? '<div style="font-size: 0.8rem; opacity: 0.5; font-style: italic;">No properties defined</div>' : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    if (Object.keys(schemasObj).length === 0) {
       html += `<div style="font-size: 0.85rem; opacity: 0.6; text-align: center; padding: 20px;">No models defined. Click "+ Add Model" to create one.</div>`;
    }

    html += `</div></div>`;

    container.innerHTML = html;

    // Attach Input Listeners
    container.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('focus', () => { isFormFocused = true; });
      input.addEventListener('blur', () => { isFormFocused = false; });
      input.addEventListener('input', async (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        await applyChange(e.target.dataset.path, val);
      });
    });

    // Attach Action Listeners
    container.querySelectorAll('.form-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = btn.dataset.action;
        const pathStr = btn.dataset.path;
        await handleAction(action, pathStr);
      });
    });

  } catch (err) {
    container.innerHTML = `<div style="color: var(--c-error); padding: 20px;">Error parsing YAML for Form View: ${err.message}</div>`;
  }
}

async function handleAction(action, pathStr) {
  try {
    const { default: YAML } = await import('yaml');
    const doc = YAML.parseDocument(currentYaml);
    const pathArray = parsePathString(pathStr);

    if (action === 'delete-op' || action === 'delete-item') {
      doc.deleteIn(pathArray);
    } else if (action === 'add-param') {
      let seq = doc.getIn(pathArray);
      if (!seq || !seq.items) {
        doc.setIn(pathArray, []);
        seq = doc.getIn(pathArray);
      }
      seq.add({ name: 'newParam', in: 'query', required: false });
    } else if (action === 'add-response') {
      let map = doc.getIn(pathArray);
      if (!map || !map.items) {
        doc.setIn(pathArray, {});
        map = doc.getIn(pathArray);
      }
      // find next unused 2xx code
      let code = '200';
      if (map.has('200')) code = '201';
      doc.setIn([...pathArray, code], { description: 'Successful response' });
    } else if (action === 'add-op') {
      let pathNode = doc.getIn(pathArray);
      if (!pathNode || !pathNode.items) {
        doc.setIn(pathArray, {});
        pathNode = doc.getIn(pathArray);
      }
      // find next unused method
      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      let method = methods.find(m => !pathNode.has(m));
      if (!method) method = 'options';
      doc.setIn([...pathArray, method], { summary: 'New operation' });
    } else if (action === 'add-path') {
      let paths = doc.getIn(['paths']);
      if (!paths) {
        doc.setIn(['paths'], {});
      }
      doc.setIn(['paths', '/newPath'], { get: { summary: 'New operation' } });
    } else if (action === 'add-schema') {
      let schemas = doc.getIn(['components', 'schemas']);
      if (!schemas) {
        doc.setIn(['components', 'schemas'], {});
        schemas = doc.getIn(['components', 'schemas']);
      }
      
      // find next unused schema name
      let baseName = 'NewModel';
      let name = baseName;
      let counter = 1;
      while (schemas.has(name)) {
        name = baseName + counter;
        counter++;
      }
      doc.setIn(['components', 'schemas', name], { type: 'object', properties: {} });
    } else if (action === 'add-schema-prop') {
      let props = doc.getIn(pathArray);
      if (!props || !props.items) {
        doc.setIn(pathArray, {});
        props = doc.getIn(pathArray);
      }
      let baseName = 'newProperty';
      let name = baseName;
      let counter = 1;
      while (props.has(name)) {
        name = baseName + counter;
        counter++;
      }
      doc.setIn([...pathArray, name], { type: 'string' });
    }

    const newYaml = String(doc);
    currentYaml = newYaml;
    if (updateContentCallback) updateContentCallback(newYaml);
    
    // Briefly force a re-render for structural changes
    isFormFocused = false; 
    renderFormEditor(newYaml);
  } catch (err) {
    console.error('Failed to handle action:', err);
  }
}

async function applyChange(pathStr, newValue) {
  try {
    const { default: YAML } = await import('yaml');
    const doc = YAML.parseDocument(currentYaml);
    const pathArray = parsePathString(pathStr);

    if (typeof newValue === 'string' && newValue.trim() === '') {
      doc.deleteIn(pathArray);
    } else {
      doc.setIn(pathArray, newValue);
    }

    const newYaml = String(doc);
    currentYaml = newYaml; 
    
    if (updateContentCallback) {
      updateContentCallback(newYaml);
    }
  } catch (err) {
    console.error('Failed to apply change:', err);
  }
}

function parsePathString(pathStr) {
  if (!pathStr) return [];
  const pathArray = [];
  pathStr.replace(/\["([^"]+)"\]|\['([^']+)'\]|\[(\d+)\]|\.([^.\[]+)|^([^.\[]+)/g, (match, q1, q2, num, dot, root) => {
    const key = q1 || q2 || num || dot || root;
    if (key !== undefined) pathArray.push(key);
  });
  // Convert numbers for arrays
  return pathArray.map(k => isNaN(k) ? k : parseInt(k, 10));
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Scroll the form editor to match the active Monaco editor path.
 */
export function scrollFormToPath(pathArray) {
  if (!pathArray || pathArray.length < 2) return;
  const pathName = pathArray[1];
  const method = pathArray[2];

  const container = document.getElementById('form-container');
  if (!container) return;

  // Try to find the exact operation block
  let targetNode = null;
  
  if (method) {
    // e.g. pathName: '/pets', method: 'get'
    const operations = container.querySelectorAll('.form-node-operation');
    for (const op of operations) {
      if (op.dataset.pathName === pathName && op.dataset.method === method) {
        targetNode = op;
        break;
      }
    }
  }

  // Fallback to path block
  if (!targetNode) {
    const paths = container.querySelectorAll('.form-node-path');
    for (const p of paths) {
      if (p.dataset.pathName === pathName) {
        targetNode = p;
        break;
      }
    }
  }

  if (targetNode) {
    targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Flash highlight
    const originalBg = targetNode.style.background;
    targetNode.style.background = 'rgba(99, 102, 241, 0.2)'; // indigo flash
    setTimeout(() => {
      targetNode.style.background = originalBg;
    }, 1000);
  }
}
