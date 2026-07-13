/**
 * GitHub REST API v3 integration
 * Fetches code from public and private repositories
 */

const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.cs', '.rb', '.go', '.java', '.vue'];

/**
 * Parse GitHub URL to extract owner, repo, path, branch
 * @param {string} url - GitHub URL
 * @returns {Object} - { owner, repo, path, branch }
 */
function parseGitHubUrl(url) {
  try {
    const urlObj = new URL(url);

    if (!urlObj.hostname.includes('github.com')) {
      throw new Error('Not a GitHub URL');
    }

    const parts = urlObj.pathname.split('/').filter((p) => p);

    if (parts.length < 2) {
      throw new Error('Invalid GitHub URL format');
    }

    const owner = parts[0];
    const repo = parts[1];
    let path = '';
    let branch = 'main';

    // Handle different URL formats
    if (parts.length > 2) {
      if (parts[2] === 'blob' || parts[2] === 'tree') {
        branch = parts[3] || 'main';
        path = parts.slice(4).join('/');
      } else {
        // Raw GitHub URL format
        branch = parts[2];
        path = parts.slice(3).join('/');
      }
    }

    return { owner, repo, path, branch };
  } catch (error) {
    throw new Error(`Invalid GitHub URL: ${error.message}`);
  }
}

/**
 * Get file content from GitHub
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} branch - Branch name
 * @param {string} token - Optional GitHub PAT
 * @returns {Promise<Object>} - { content, language, filename, size }
 */
async function getFileContent(owner, repo, path, branch = 'main', token) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};

    const response = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      {
        params: { ref: branch },
        headers,
      }
    );

    if (response.data.type !== 'file') {
      throw new Error('Path is not a file');
    }

    // Decode base64 content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    const filename = response.data.name;
    const size = response.data.size;
    const ext = `.${filename.split('.').pop()}`;
    const language = ext.toLowerCase();

    return { content, language, filename, size };
  } catch (error) {
    throw new Error(`Failed to fetch file from GitHub: ${error.message}`);
  }
}

/**
 * Get directory contents from GitHub
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Directory path
 * @param {string} branch - Branch name
 * @param {string} token - Optional GitHub PAT
 * @returns {Promise<Array>} - Array of { path, language, filename, size }
 */
async function getDirectoryFiles(owner, repo, path = '', branch = 'main', token) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};

    const response = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      {
        params: { ref: branch },
        headers,
      }
    );

    if (!Array.isArray(response.data)) {
      throw new Error('Path is not a directory');
    }

    const files = response.data
      .filter((item) => item.type === 'file')
      .filter((item) => SUPPORTED_EXTENSIONS.some((ext) => item.name.toLowerCase().endsWith(ext)))
      .map((item) => ({
        path: item.path,
        filename: item.name,
        size: item.size,
        language: `.${item.name.split('.').pop()}`,
      }));

    return files;
  } catch (error) {
    throw new Error(`Failed to fetch directory from GitHub: ${error.message}`);
  }
}

/**
 * Get repository tree recursively
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} token - Optional GitHub PAT
 * @returns {Promise<Array>} - Array of { path, type }
 */
async function getRepoTree(owner, repo, branch = 'main', token) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};

    // First get the branch SHA
    const branchResponse = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/branches/${branch}`,
      { headers }
    );

    const treeSha = branchResponse.data.commit.sha;

    // Get tree recursively
    const treeResponse = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${treeSha}`,
      {
        params: { recursive: 1 },
        headers,
      }
    );

    const files = treeResponse.data.tree
      .filter((item) => item.type === 'blob')
      .filter((item) => SUPPORTED_EXTENSIONS.some((ext) => item.path.toLowerCase().endsWith(ext)));

    return files;
  } catch (error) {
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }
}

/**
 * Validate GitHub token
 * @param {string} token - GitHub PAT
 * @returns {Promise<Object>} - { valid, username, hasRepoScope }
 */
async function validateToken(token) {
  try {
    const response = await axios.get(`${GITHUB_API}/user`, {
      headers: { Authorization: `token ${token}` },
    });

    const username = response.data.login;
    const scopes = response.headers['x-oauth-scopes']?.split(',') || [];
    const hasRepoScope = scopes.some((scope) => scope.includes('repo'));

    return { valid: true, username, hasRepoScope };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Check GitHub rate limit
 * @param {string} token - Optional GitHub PAT
 * @returns {Promise<Object>} - { remaining, reset }
 */
async function checkRateLimit(token) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};

    const response = await axios.get(`${GITHUB_API}/rate_limit`, { headers });

    const remaining = response.data.rate_limit.remaining;
    const reset = new Date(response.data.rate_limit.reset * 1000);

    return { remaining, reset };
  } catch (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`);
  }
}

module.exports = {
  parseGitHubUrl,
  getFileContent,
  getDirectoryFiles,
  getRepoTree,
  validateToken,
  checkRateLimit,
  SUPPORTED_EXTENSIONS,
  GITHUB_API,
};
