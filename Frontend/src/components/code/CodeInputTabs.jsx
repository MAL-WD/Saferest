import React, { useState } from 'react';
import PasteEditor from './PasteEditor';
import FileUploadZone from './FileUploadZone';
import GitHubRepoInput from './GitHubRepoInput';

const CodeInputTabs = ({ onScanStart, isScanning }) => {
  const [activeTab, setActiveTab] = useState('paste');

  const handlePasteScan = (payload) => {
    onScanStart({ endpoint: 'paste', payload });
  };

  const handleUploadScan = (payload) => {
    onScanStart({ endpoint: 'upload', payload });
  };

  const handleGitHubScan = (payload) => {
    onScanStart({ endpoint: 'github', payload });
  };

  return (
    <div className="card card-glass">
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`btn ${activeTab === 'paste' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('paste')}
          disabled={isScanning}
        >
          Paste Code
        </button>
        <button
          className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('upload')}
          disabled={isScanning}
        >
          Upload File
        </button>
        <button
          className={`btn ${activeTab === 'github' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('github')}
          disabled={isScanning}
        >
          GitHub Repository
        </button>
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'paste' && <PasteEditor onScan={handlePasteScan} isScanning={isScanning} />}
        {activeTab === 'upload' && <FileUploadZone onScan={handleUploadScan} isScanning={isScanning} />}
        {activeTab === 'github' && <GitHubRepoInput onScan={handleGitHubScan} isScanning={isScanning} />}
      </div>
    </div>
  );
};

export default CodeInputTabs;
