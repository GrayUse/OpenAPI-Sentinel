/**
 * OpenAPI Sentinel — Main Application Entry
 * Orchestrates editor, linting, docs preview, mock server, and rule config.
 */

import { initEditor, getEditorContent, setEditorContent, setCursorListener, setMarkers, revealLine, jumpToNode } from './components/editor.js';
import { updateStructureTree } from './components/sidebar.js';
import { renderProblems } from './components/problems-panel.js';
import { renderDocsPreview } from './components/docs-preview.js';
import { initRulesPanel, getRuleConfig } from './components/rule-config.js';
import { lintSpec } from './components/linter-client.js';
import { initFormEditor, renderFormEditor, isFormFocused, scrollFormToPath } from './components/form-editor.js';

// Expose globally for inline event handlers
window.__jumpToNode = jumpToNode;
window.__scrollFormToPath = scrollFormToPath;

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

    // Update spec info and structure
    updateSpecInfo(data.meta);
    updateStructureTree(data.meta);
    
    // Render side-by-side Form View (skip if user is actively typing in the form to prevent focus loss)
    if (!isFormFocused) {
      renderFormEditor(state.currentSpec);
    }

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

// ── File Actions ──
function initFileActions() {
  const btnExport = document.getElementById('btn-export');

  btnExport?.addEventListener('click', () => {
    const content = getEditorContent();
    if (!content) return;
    
    try {
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
    } catch (err) {
      console.error(err);
      showToast('Failed to export', 'error');
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
  let isEditorScrolling = false;
  let isFormScrolling = false;
  let programmaticScrollTimeout = null;
  window.__isProgrammaticScroll = false;

  window.__triggerNavigate = (pathArray) => {
    window.__isProgrammaticScroll = true;
    window.__jumpToNode(pathArray);
    window.__scrollFormToPath(pathArray);
    clearTimeout(programmaticScrollTimeout);
    programmaticScrollTimeout = setTimeout(() => { window.__isProgrammaticScroll = false; }, 100);
  };

  await initEditor('monaco-editor', {
    onChange: scheduleLint,
    onCursorChange: (line, col) => {
      document.getElementById('status-cursor').textContent = `Ln ${line}, Col ${col}`;
    },
    onLanguageChange: (lang) => {
      document.getElementById('status-format').textContent = lang.toUpperCase();
    },
    onScrollChange: (scrollTop, scrollHeight) => {
      if (window.__isProgrammaticScroll) {
        clearTimeout(programmaticScrollTimeout);
        programmaticScrollTimeout = setTimeout(() => { window.__isProgrammaticScroll = false; }, 100);
        return;
      }
      if (isFormScrolling) return;
      
      const formWrapper = document.getElementById('form-scroll-wrapper');
      if (!formWrapper) return;
      isEditorScrolling = true;
      const percent = scrollTop / scrollHeight;
      formWrapper.scrollTop = percent * formWrapper.scrollHeight;
      setTimeout(() => { isEditorScrolling = false; }, 50);
    }
  });

  // Init Form Scroll Sync
  const formWrapper = document.getElementById('form-scroll-wrapper');
  if (formWrapper) {
    formWrapper.addEventListener('scroll', () => {
      if (window.__isProgrammaticScroll) {
        clearTimeout(programmaticScrollTimeout);
        programmaticScrollTimeout = setTimeout(() => { window.__isProgrammaticScroll = false; }, 100);
        return;
      }
      if (isEditorScrolling) return;
      
      isFormScrolling = true;
      const percent = formWrapper.scrollTop / formWrapper.scrollHeight;
      if (window.__setEditorScroll) {
        window.__setEditorScroll(percent);
      }
      setTimeout(() => { isFormScrolling = false; }, 50);
    });
  }

  // Init UI components
  initTabs();
  initFileActions();
  initRulesPanel();
  initFormEditor((newYaml) => {
    setEditorContent(newYaml);
    scheduleLint();
  });

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
