import React from 'react';

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'csharp', label: 'C#' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
];

const LanguageSelector = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="lang-select" className="text-sm font-semibold text-muted whitespace-nowrap">
        Language
      </label>
      <select
        id="lang-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
        style={{ width: 'auto', display: 'inline-block', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
