/**
 * Sidebar Component
 * Provides spec structure navigation.
 */

/**
 * Update the spec structure tree based on parsed spec metadata.
 */
export function updateStructureTree(spec) {
  const container = document.getElementById('spec-structure');
  if (!spec) {
    container.innerHTML = '<div class="sidebar-item" style="opacity:0.4">No spec loaded</div>';
    return;
  }

  let html = '';

  // Info
  if (spec.title) {
    html += `
      <div class="sidebar-item clickable" onclick="window.__triggerNavigate(['info'])">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">${getStructureIcon('info')}</svg>
        Info
        <span class="badge">${spec.version || ''}</span>
      </div>`;
  }

  // Paths
  if (spec.paths && spec.paths.length > 0) {
    html += `
      <div class="sidebar-item" style="opacity: 0.6; padding-top: 12px; pointer-events: none;">
        PATHS
      </div>`;
    spec.paths.forEach(pathItem => {
      const pathName = typeof pathItem === 'string' ? pathItem : pathItem.name;
      const methods = pathItem.methods || [];
      
      html += `
        <div class="sidebar-item clickable" onclick="window.__triggerNavigate(['paths', '${pathName}'])">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">${getStructureIcon('path')}</svg>
          <span style="font-family: var(--ff-mono, monospace); font-size: 11px;">${pathName}</span>
        </div>`;
        
      methods.forEach(method => {
        const methodColors = {
          get: '#3b82f6', post: '#10b981', put: '#f59e0b', delete: '#ef4444', patch: '#8b5cf6'
        };
        const color = methodColors[method] || '#9ca3af';
        html += `
          <div class="sidebar-item clickable" style="padding-left: 28px; padding-top: 4px; padding-bottom: 4px; border-left: 1px solid var(--c-border); margin-left: 10px;" onclick="window.__triggerNavigate(['paths', '${pathName}', '${method}'])">
            <span style="color: ${color}; font-weight: bold; font-size: 9px; width: 36px; text-transform: uppercase;">${method}</span>
          </div>`;
      });
    });
  }

  // Schemas
  if (spec.schemas && spec.schemas.length > 0) {
    html += `
      <div class="sidebar-item" style="opacity: 0.6; padding-top: 12px; pointer-events: none;">
        SCHEMAS
      </div>`;
    spec.schemas.forEach(schema => {
      html += `
        <div class="sidebar-item clickable" onclick="window.__triggerNavigate(['components', 'schemas', '${schema}'])">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">${getStructureIcon('schema')}</svg>
          <span style="font-family: var(--font-mono); font-size: 11px;">${schema}</span>
        </div>`;
    });
  }

  container.innerHTML = html || '<div class="sidebar-item" style="opacity:0.4">Empty Spec</div>';
}

function getStructureIcon(type) {
  const icons = {
    info: '<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    server: '<rect x="2" y="3" width="12" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="12" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="5" r="0.5" fill="currentColor"/><circle cx="5" cy="11" r="0.5" fill="currentColor"/>',
    path: '<path d="M2 8h12M6 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    schema: '<rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 7h10M7 3v10" stroke="currentColor" stroke-width="1.5"/>',
    lock: '<rect x="4" y="7" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 7V5a2 2 0 114 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  };
  return icons[type] || icons.info;
}
