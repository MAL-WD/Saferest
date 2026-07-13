import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const SEVERITY_COLORS = {
  critical: 'rgba(244, 67, 54, 0.1)',
  high: 'rgba(255, 152, 0, 0.1)',
  medium: 'rgba(255, 193, 7, 0.1)',
  low: 'rgba(33, 150, 243, 0.1)',
  info: 'rgba(156, 39, 176, 0.1)',
};

const CodeViewer = ({ code, language, findings, selectedFinding }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && selectedFinding) {
      const line = selectedFinding.line || 1;
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
    }
  }, [selectedFinding]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    if (findings && findings.length > 0) {
      const decorations = findings.map((finding) => ({
        range: new (editor.getModel().constructor.Range || window.monaco.Range)(
          finding.line,
          1,
          finding.lineEnd || finding.line,
          1
        ),
        options: {
          isWholeLine: true,
          inlineClassName: `vuln-line-${finding.severity}`,
          glyphMarginClassName: `vuln-glyph-${finding.severity}`,
          glyphMarginHoverMessage: { value: `**${finding.severity.toUpperCase()}**: ${finding.title}` },
          minimap: { color: SEVERITY_COLORS[finding.severity], position: 2 },
        },
      }));

      editor.deltaDecorations([], decorations);
    }
  };

  return (
    <div className="h-96 rounded-xl border border-gray-700 overflow-hidden shadow-lg bg-gray-950">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 13,
          minimap: { enabled: true, size: 'proportional' },
          scrollBeyondLastLine: false,
          readOnly: true,
          glyphMargin: true,
          lineNumbers: 'on',
          wordWrap: 'on',
          fontLigatures: true,
        }}
      />
    </div>
  );
};

export default CodeViewer;
