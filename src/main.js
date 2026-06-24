/**
 * OpenAPI Sentinel — Main Application Entry
 * Orchestrates editor, linting, docs preview, mock server, and rule config.
 */

import { initEditor, getEditorContent, setEditorContent, setCursorListener, setMarkers, revealLine } from './components/editor.js';
import { initSidebar } from './components/sidebar.js';
import { renderProblems } from './components/problems-panel.js';
import { renderDocsPreview } from './components/docs-preview.js';
import { initMockPanel } from './components/mock-panel.js';
import { initRulesPanel, getRuleConfig } from './components/rule-config.js';
import { lintSpec } from './components/linter-client.js';

// ── State ──
const state = {
  currentSpec: '',
  lintResults: null,
  lintTimer: null,
  activeMock: false,
  activeTab: 'editor',
};

// ── Tab Navigation ──
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  state.activeTab = tab;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update panels
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });

  // Trigger panel-specific updates
  if (tab === 'docs' && state.currentSpec) {
    renderDocsPreview(state.currentSpec);
  }
}

// ── Linting ──
async function lintCurrentSpec() {
  const source = getEditorContent();
  if (!source || source.trim().length < 10) return;

  state.currentSpec = source;
  updateLintStatus('running', 'Linting...');

  try {
    const config = getRuleConfig();
    const data = await lintSpec(source, config);

    if (data.error) {
      updateLintStatus('error', data.error);
      return;
    }

    state.lintResults = data;

    // Update Monaco markers
    setMarkers(data.diagnostics);

    // Update problems panel
    renderProblems(data.diagnostics, data.stats, (line) => {
      switchTab('editor');
      revealLine(line);
    });

    // Update spec info
    updateSpecInfo(data.meta);

    // Update status
    if (data.stats.errors > 0) {
      updateLintStatus('error', `${data.stats.errors} error(s), ${data.stats.warnings} warning(s)`);
    } else if (data.stats.warnings > 0) {
      updateLintStatus('success', `${data.stats.warnings} warning(s)`);
    } else {
      updateLintStatus('success', 'No issues');
    }

    // Update file size
    const bytes = new TextEncoder().encode(source).length;
    document.getElementById('status-size').textContent = formatBytes(bytes);
  } catch (err) {
    console.error('[lint]', err);
    updateLintStatus('error', 'Lint failed');
  }
}

function scheduleLint() {
  clearTimeout(state.lintTimer);
  state.lintTimer = setTimeout(lintCurrentSpec, 600);
}

function updateLintStatus(status, text) {
  const el = document.getElementById('status-lint');
  const dot = el.querySelector('.status-dot');
  dot.className = `status-dot ${status}`;
  el.childNodes[el.childNodes.length - 1].textContent = ` ${text}`;
}

function updateSpecInfo(meta) {
  if (!meta || !meta.openapi) return;
  const badge = document.getElementById('spec-version-badge');
  const title = document.getElementById('spec-title');
  badge.textContent = meta.openapi;
  title.textContent = meta.title || 'Untitled';
}

// ── Import / Export ──
let fileHandle = null;

function initFileActions() {
  const fileInput = document.getElementById('file-input');
  const btnImport = document.getElementById('btn-import');
  const btnExport = document.getElementById('btn-export');

  btnImport.addEventListener('click', async () => {
    try {
      if (!window.showOpenFilePicker) {
        fileInput.click();
        return;
      }
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'OpenAPI Spec Files',
          accept: { 'text/yaml': ['.yaml', '.yml'], 'application/json': ['.json'] }
        }]
      });
      fileHandle = handle;
      const file = await fileHandle.getFile();
      const text = await file.text();
      setEditorContent(text);
      showToast(`Loaded: ${file.name}`, 'success');
      
      const titleEl = document.getElementById('spec-title');
      if (titleEl) titleEl.textContent = file.name;
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setEditorContent(text);
    showToast(`Loaded: ${file.name}`, 'success');
    
    const titleEl = document.getElementById('spec-title');
    if (titleEl) titleEl.textContent = file.name;
    
    fileHandle = null;
    fileInput.value = '';
  });

  btnExport.addEventListener('click', async () => {
    const content = getEditorContent();
    if (!content) return;
    
    try {
      if (!window.showSaveFilePicker) {
        // Fallback for unsupported browsers
        const isJson = content.trimStart().startsWith('{');
        const ext = isJson ? 'json' : 'yaml';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openapi-spec.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Spec exported', 'success');
        return;
      }

      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: 'openapi-spec.yaml',
          types: [{
            description: 'YAML File',
            accept: { 'text/yaml': ['.yaml', '.yml'] }
          }]
        });
      }
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      showToast('Saved successfully', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  });
}

// ── Toast ──
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
window.__showToast = showToast;

// ── Utilities ──
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ── Initialize ──
async function init() {
  // Init Monaco editor
  await initEditor('monaco-editor', {
    onChange: scheduleLint,
    onCursorChange: (line, col) => {
      document.getElementById('status-cursor').textContent = `Ln ${line}, Col ${col}`;
    },
    onLanguageChange: (lang) => {
      document.getElementById('status-format').textContent = lang.toUpperCase();
    },
  });

  // Init UI components
  initTabs();
  initFileActions();
  initSidebar((content) => {
    setEditorContent(content);
  });
  initMockPanel(() => getEditorContent());
  initRulesPanel();

  // Load default sample
  try {
    const res = await fetch('/api/files/sample/petstore.yaml');
    const data = await res.json();
    if (data.content) {
      setEditorContent(data.content);
    }
  } catch {
    // Server might not be running — set a placeholder
    setEditorContent(`openapi: "3.1.0"
info:
  title: My API
  version: "1.0.0"
paths: {}
`);
  }
}

init().catch(console.error);
