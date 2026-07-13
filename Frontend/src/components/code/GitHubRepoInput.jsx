import React, { useState } from 'react';

const GitHubRepoInput = ({ onScan }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('github.com');
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value) => {
    setRepoUrl(value);
    setError(null);
    setPreview(null);

    if (value && validateUrl(value)) {
      try {
        const urlObj = new URL(value);
        const parts = urlObj.pathname.split('/').filter((p) => p);
        const owner = parts[0];
        const repo = parts[1];
        const pathPart = parts.slice(4).join('/') || 'root';

        setPreview({
          owner,
          repo,
          path: pathPart,
        });
      } catch {
        // Ignore
      }
    }
  };

  const handleScan = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateUrl(repoUrl)) {
      setError('Invalid GitHub URL format');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onScan({
        repoUrl,
        branch: branch || 'main',
        path: path || '',
        token: token || undefined,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="repo-url" className="text-sm font-medium text-gray-400">
          Repository URL
        </label>
        <input
          id="repo-url"
          type="text"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-gray-600"
        />
        {preview && (
          <div className="px-4 py-3 bg-green-900/10 border border-green-600 rounded-lg text-sm flex items-center gap-2">
            <span className="text-green-400 font-medium">Scanning:</span>
            <span className="text-green-300 font-semibold">{preview.owner}/{preview.repo}</span>
            {preview.path !== 'root' && <span className="text-green-300 opacity-75">/{preview.path}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="branch" className="text-sm font-medium text-gray-400">
            Branch
          </label>
          <input
            id="branch"
            type="text"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-gray-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="path" className="text-sm font-medium text-gray-400">
            File/Folder Path
          </label>
          <input
            id="path"
            type="text"
            placeholder="src/auth.js (optional)"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-gray-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="token" className="text-sm font-medium text-gray-400">
            GitHub Personal Access Token
          </label>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-300 transition"
            onClick={() => setShowToken(!showToken)}
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          id="token"
          type={showToken ? 'text' : 'password'}
          placeholder="ghp_... (optional, for private repos)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          Token requires repo:read scope. Used only during this scan, never stored.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          className="btn btn-primary btn-lg flex-1"
          onClick={handleScan}
          disabled={loading || !repoUrl.trim()}
        >
          {loading ? 'Fetching Repository...' : 'Scan Repository'}
        </button>
      </div>
    </div>
  );
};

export default GitHubRepoInput;
