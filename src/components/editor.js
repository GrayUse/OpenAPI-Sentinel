/**
 * Monaco Editor Component
 * Wraps Monaco with YAML/JSON support, custom dark theme, and marker management.
 */

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

window.MonacoEnvironment = {
  getWorker(_, label) {
    return new EditorWorker();
  }
};

let editor = null;
let editorModel = null;

// Detect language from content
function detectLanguage(content) {
  const trimmed = content.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  return 'yaml';
}

/**
 * Initialize Monaco editor in the given container.
 */
export async function initEditor(containerId, { onChange, onCursorChange, onLanguageChange, onScrollChange }) {
  const monaco = await import('monaco-editor');

  // Define custom dark theme
  monaco.editor.defineTheme('sentinel-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6078', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c084fc' },
      { token: 'string', foreground: '86efac' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'type', foreground: '60a5fa' },
      { token: 'key', foreground: '93c5fd' },
      { token: 'string.yaml', foreground: '86efac' },
      { token: 'number.yaml', foreground: 'fbbf24' },
      { token: 'keyword.yaml', foreground: 'c084fc' },
    ],
    colors: {
      'editor.background': '#0f1119',
      'editor.foreground': '#e8eaf0',
      'editor.lineHighlightBackground': '#1a1e2e',
      'editor.selectionBackground': '#6366f140',
      'editor.inactiveSelectionBackground': '#6366f120',
      'editorCursor.foreground': '#818cf8',
      'editorLineNumber.foreground': '#3d4258',
      'editorLineNumber.activeForeground': '#8b90a5',
      'editorIndentGuide.background': '#1e2233',
      'editorIndentGuide.activeBackground': '#2d3348',
      'editorWidget.background': '#181c28',
      'editorWidget.border': '#252a3a',
      'editorSuggestWidget.background': '#181c28',
      'editorSuggestWidget.border': '#252a3a',
      'editorSuggestWidget.selectedBackground': '#6366f130',
      'minimap.background': '#0c0e14',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#ffffff15',
      'scrollbarSlider.hoverBackground': '#ffffff25',
      'scrollbarSlider.activeBackground': '#ffffff30',
    },
  });

  // Create editor
  const container = document.getElementById(containerId);
  editor = monaco.editor.create(container, {
    value: '',
    language: 'yaml',
    theme: 'sentinel-dark',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    lineHeight: 20,
    fontLigatures: true,
    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    roundedSelection: true,
    padding: { top: 12 },
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    suggest: { showWords: false },
    quickSuggestions: { strings: true, other: true, comments: false },
    tabSize: 2,
    wordWrap: 'off',
    automaticLayout: true,
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'indentation',
  });

  editorModel = editor.getModel();

  // Listen for content changes
  editorModel.onDidChangeContent(() => {
    const content = editorModel.getValue();
    const lang = detectLanguage(content);
    const currentLang = editorModel.getLanguageId();
    if (lang !== currentLang) {
      monaco.editor.setModelLanguage(editorModel, lang);
      onLanguageChange?.(lang);
    }
    onChange?.();
  });

  // Listen for cursor changes
  editor.onDidChangeCursorPosition((e) => {
    onCursorChange?.(e.position.lineNumber, e.position.column);
  });

  // Listen for scroll changes
  editor.onDidScrollChange((e) => {
    if (e.scrollTopChanged) {
      onScrollChange?.(e.scrollTop, editor.getScrollHeight());
    }
  });

  // Handle resize
  window.addEventListener('resize', () => editor.layout());

  return editor;
}

/**
 * Get current editor content.
 */
export function getEditorContent() {
  return editorModel?.getValue() || '';
}

/**
 * Set editor content.
 */
export function setEditorContent(content) {
  if (!editorModel) return;
  editorModel.setValue(content);
}

/**
 * Set diagnostic markers on the editor.
 */
export function setMarkers(diagnostics) {
  if (!editorModel || !editor) return;
  const monaco = window.monaco || editor._themeService?._theme; // fallback

  const markers = diagnostics.map((d) => ({
    severity: d.severity === 'error' ? 8 : d.severity === 'warning' ? 4 : 2,
    startLineNumber: d.location.startLine,
    startColumn: d.location.startCol,
    endLineNumber: d.location.endLine,
    endColumn: d.location.endCol,
    message: `[${d.ruleId}] ${d.message}`,
    source: 'OpenAPI Sentinel',
  }));

  // Access monaco namespace through the import
  import('monaco-editor').then((monaco) => {
    monaco.editor.setModelMarkers(editorModel, 'sentinel', markers);
  });
}

/**
 * Reveal a specific line in the editor.
 */
export function revealLine(line) {
  if (!editor) return;
  
  // First, reveal the line roughly so Monaco schedules layout
  editor.revealLine(line);
  editor.setPosition({ lineNumber: line, column: 1 });
  editor.focus();
  
  // Monaco calculates virtual line heights asynchronously.
  // We apply the exact Top offset across a few frames to guarantee precision.
  [10, 50, 150].forEach(delay => {
    setTimeout(() => {
      if (!editor) return;
      const top = editor.getTopForLineNumber(line);
      editor.setScrollTop(top);
    }, delay);
  });
}

/**
 * Reveal a specific YAML node based on its object path.
 */
export async function jumpToNode(pathArray) {
  if (!editorModel) return;
  const content = editorModel.getValue();
  if (detectLanguage(content) !== 'yaml') return;
  
  try {
    const { default: YAML } = await import('yaml');
    const doc = YAML.parseDocument(content);
    const node = doc.getIn(pathArray, true);
    if (node && node.range) {
      const charIndex = node.range[0];
      const line = content.slice(0, charIndex).split('\n').length;
      revealLine(line);
      
      // Briefly highlight the line
      import('monaco-editor').then((monaco) => {
        const decoration = {
          range: new monaco.Range(line, 1, line, 1),
          options: { isWholeLine: true, className: 'flash-highlight' }
        };
        const id = editor.deltaDecorations([], [decoration]);
        setTimeout(() => editor.deltaDecorations(id, []), 1500);
      });
    }
  } catch (err) {
    console.error('Failed to jump to node:', err);
  }
}

/**
 * Set cursor change listener.
 */
export function setCursorListener(cb) {
  if (!editor) return;
  editor.onDidChangeCursorPosition((e) => {
    cb(e.position.lineNumber, e.position.column);
  });
}

/**
 * Set proportional scroll.
 */
export function setEditorScroll(percent) {
  if (!editor) return;
  const scrollHeight = editor.getScrollHeight();
  editor.setScrollTop(percent * scrollHeight);
}

window.__setEditorScroll = setEditorScroll;
