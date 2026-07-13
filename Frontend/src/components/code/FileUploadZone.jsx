import React, { useRef, useState } from 'react';

const FileUploadZone = ({ onScan }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.cs', '.rb', '.go', '.java', '.vue'];
  const MAX_SIZE = 500 * 1024;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const validateFile = (file) => {
    const ext = `.${file.name.split('.').pop()}`.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError(`File type not supported. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('File exceeds maximum size of 500KB');
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    setError(null);
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await onScan(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={SUPPORTED_EXTENSIONS.join(',')}
        className="hidden"
      />

      <div
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 cursor-pointer shadow-inner ${
          dragOver
            ? 'border-blue-500 bg-gradient-to-br from-blue-900/40 to-blue-800/20 scale-105'
            : selectedFile
            ? 'border-green-600 bg-gradient-to-br from-green-900/30 to-green-800/10 shadow-lg'
            : 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/30 hover:border-gray-500 hover:bg-gradient-to-br hover:from-gray-800 hover:to-gray-900/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="inline-block p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-full shadow-lg">
              <div className="text-4xl font-bold text-white">✓</div>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm mt-2 font-mono">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <div className="flex gap-3 justify-center mt-8 pt-4">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleScan}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Scan File'}
              </button>
              <button
                className="btn btn-outline btn-lg"
                onClick={handleRemove}
              >
                Change File
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl font-light text-gray-500 animate-bounce">↑</div>
            <div>
              <p className="text-white font-bold text-lg">Drop your source file here</p>
              <p className="text-gray-400 text-sm mt-2">or click to browse from your device</p>
            </div>
            <div className="pt-4 space-y-1">
              <p className="text-gray-500 text-xs font-mono">Supported: {SUPPORTED_EXTENSIONS.join(', ')}</p>
              <p className="text-gray-500 text-xs font-semibold">Maximum file size: 500 KB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
