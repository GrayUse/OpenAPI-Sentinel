/**
 * Sidebar Component
 * Provides sample file loading and spec structure navigation.
 */

export function initSidebar(onLoadContent) {
  loadSampleList(onLoadContent);
}

async function loadSampleList(onLoadContent) {
  const container = document.getElementById('sample-list');
  const samples = ['petstore.yaml'];
  
  container.innerHTML = '';
  samples.forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${name}
    `;
    btn.addEventListener('click', () => loadSample(name, onLoadContent));
    container.appendChild(btn);
  });
}

async function loadSample(name, onLoadContent) {
  try {
    const res = await fetch(`./sample/${name}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const content = await res.text();
    
    if (content) {
      onLoadContent(content);
      window.__showToast?.(`Loaded: ${name}`, 'success');

      // Highlight active item
      document.querySelectorAll('#sample-list .sidebar-item').forEach((item) => {
        item.classList.toggle('active', item.textContent.trim() === name);
      });
    }
  } catch (err) {
    window.__showToast?.(`Failed to load ${name}`, 'error');
  }
}

/**
 * Update the spec structure tree based on parsed spec metadata.
 */
export function updateStructureTree(spec) {
  const container = document.getElementById('spec-structure');
  if (!spec) {
    container.innerHTML = '<div class="sidebar-item" style="opacity:0.4">No spec loaded</div>';
    return;
  }

  const items = [];

  // Info
  if (spec.info) {
    items.push({ icon: 'info', label: 'Info', badge: spec.info.version || '' });
  }

  // Servers
  if (spec.servers) {
    items.push({ icon: 'server', label: 'Servers', badge: spec.servers.length });
  }

  // Paths
  if (spec.paths) {
    const pathCount = Object.keys(spec.paths).length;
    items.push({ icon: 'path', label: 'Paths', badge: pathCount });
  }

  // Schemas
  if (spec.components?.schemas) {
    const schemaCount = Object.keys(spec.components.schemas).length;
    items.push({ icon: 'schema', label: 'Schemas', badge: schemaCount });
  }

  // Security
  if (spec.components?.securitySchemes) {
    const secCount = Object.keys(spec.components.securitySchemes).length;
    items.push({ icon: 'lock', label: 'Security', badge: secCount });
  }

  container.innerHTML = items.map((item) => `
    <div class="sidebar-item">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        ${getStructureIcon(item.icon)}
      </svg>
      ${item.label}
      <span class="badge">${item.badge}</span>
    </div>
  `).join('');
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
