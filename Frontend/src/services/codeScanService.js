import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const codeScanService = {
  // Paste code scan
  async scanPasteCode(code, language) {
    const response = await api.post('/code-scan', {
      code,
      language,
      source: 'paste',
    });
    return response.data;
  },

  // Upload file scan
  async scanUploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/code-scan/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // GitHub repo scan
  async scanGitHubRepo(repoUrl, branch, path, token) {
    const response = await api.post('/code-scan/github', {
      repoUrl,
      branch: branch || 'main',
      path: path || '',
      token: token || null,
    });
    return response.data;
  },

  // Get scan details
  async getScan(scanId) {
    const response = await api.get(`/code-scan/${scanId}`);
    return response.data;
  },

  // List user scans
  async listScans(page = 1, limit = 10, filter = null) {
    const response = await api.get('/code-scan', {
      params: {
        page,
        limit,
        filter,
      },
    });
    return response.data;
  },

  // Delete scan
  async deleteScan(scanId) {
    const response = await api.delete(`/code-scan/${scanId}`);
    return response.data;
  },

  // Export scan as JSON
  async exportJSON(scanId) {
    const response = await api.get(`/code-scan/${scanId}/export/json`, {
      responseType: 'blob',
    });
    return response;
  },

  // Export scan as PDF
  async exportPDF(scanId) {
    const response = await api.get(`/code-scan/${scanId}/export/pdf`, {
      responseType: 'blob',
    });
    return response;
  },

  // Validate GitHub token
  async validateGitHubToken(token) {
    const response = await api.post('/code-scan/validate-token', {
      token,
    });
    return response.data;
  },
};

export default codeScanService;
