import React, { useState, useEffect } from 'react';

const Certificate = ({ account, userRole }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    recipient: '',
    issuer: '',
    file: null
  });

  // Verify form state
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    loadAllCertificates();
  }, []);

  const loadAllCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://shardeum.wuaze.com/backend/certificate.php?action=all');
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        setError(data.message || 'Failed to load certificates');
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title || !uploadForm.recipient || !uploadForm.issuer || !uploadForm.file) {
      setError('Please fill in all fields and select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('recipient', uploadForm.recipient);
      formData.append('issuer', uploadForm.issuer);
      formData.append('file', uploadForm.file);

      const response = await fetch('https://shardeum.wuaze.com/backend/certificate.php?action=upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Certificate uploaded successfully! Hash: ${data.data?.hash || 'Generated'}`);
        setUploadForm({ title: '', recipient: '', issuer: '', file: null });
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        loadAllCertificates(); // Refresh the list
      } else {
        setError(data.message || 'Failed to upload certificate');
      }
    } catch (err) {
      console.error('Error uploading certificate:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Failed to connect to server. Please check if the backend is running.');
      } else {
        setError('Failed to upload certificate: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verifyHash.trim()) {
      setError('Please enter a certificate hash');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);

      const formData = new FormData();
      formData.append('hash', verifyHash.trim());

      const response = await fetch('https://shardeum.wuaze.com/backend/certificate.php?action=verify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data.data);
      } else {
        setError(data.message || 'Certificate not found');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Failed to connect to server. Please check if the backend is running.');
      } else {
        setError('Failed to verify certificate: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setVerificationResult(null);
  };

  const tabs = [
    { id: 'upload', label: 'Upload Certificate', icon: '📤' },
    { id: 'verify', label: 'Verify Certificate', icon: '🔍' },
    { id: 'all', label: 'All Certificates', icon: '📋' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl">🏆</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificate Manager</h1>
            <p className="text-gray-600">Upload, verify, and manage certificates with Cloudinary storage</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                clearMessages();
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-lg mr-2">❌</span>
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 text-lg mr-2">✅</span>
            <span className="text-green-700">{success}</span>
            <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800">×</button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-2xl">📤</span>
              <h2 className="text-2xl font-bold text-gray-900">Upload Certificate</h2>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Blockchain Development Course"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.recipient}
                    onChange={(e) => setUploadForm({...uploadForm, recipient: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.issuer}
                    onChange={(e) => setUploadForm({...uploadForm, issuer: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Tech Academy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadForm({ title: '', recipient: '', issuer: '', file: null });
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Upload Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verify Tab */}
        {activeTab === 'verify' && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-2xl">🔍</span>
              <h2 className="text-2xl font-bold text-gray-900">Verify Certificate</h2>
            </div>

            <form onSubmit={handleVerify} className="mb-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Hash/ID
                  </label>
                  <input
                    type="text"
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter certificate hash to verify"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyHash('');
                      setVerificationResult(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>

            {verificationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <span className="text-green-600 text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Certificate Verified!</h3>
                    <p className="text-sm text-green-700">This certificate is authentic and valid</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Title:</span>
                      <p className="font-semibold text-gray-900">{verificationResult.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Recipient:</span>
                      <p className="font-semibold text-gray-900">{verificationResult.recipient}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Issuer:</span>
                      <p className="font-semibold text-gray-900">{verificationResult.issuer}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <p className={`font-semibold capitalize ${
                        verificationResult.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{verificationResult.status}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <p className="font-semibold text-gray-900">
                        {verificationResult.created_at ? new Date(verificationResult.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Certificate ID:</span>
                      <p className="font-semibold text-gray-900">#{verificationResult.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Hash/Public ID:</span>
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded">{verificationResult.hash}</p>
                    </div>
                  </div>
                </div>

                {verificationResult.cloud_url && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <a
                      href={verificationResult.cloud_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span>📄</span>
                      <span>View Certificate</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All Certificates Tab */}
        {activeTab === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <h2 className="text-2xl font-bold text-gray-900">All Certificates</h2>
              </div>
              <button
                onClick={loadAllCertificates}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading certificates...</span>
              </div>
            ) : certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl">🎓</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                          <p className="text-sm text-gray-600">{cert.recipient}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {cert.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Issuer:</span>
                        <span className="font-medium">{cert.issuer}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Certificate ID:</span>
                        <span className="font-medium">#{cert.id}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Hash/Public ID:</span>
                        <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">{cert.hash}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {cert.cloud_url && (
                        <a
                          href={cert.cloud_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
                        >
                          📄 View
                        </a>
                      )}
                      <button
                        onClick={() => navigator.clipboard.writeText(cert.hash)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Found</h3>
                <p className="text-gray-600">Upload your first certificate to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Certificate Management Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-1">📤 Upload Certificates</h4>
                <p>Upload certificates to Cloudinary cloud storage with database backup and unique hash generation</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">🔍 Verify Authenticity</h4>
                <p>Verify certificate authenticity using unique public IDs generated by Cloudinary</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">📋 Manage All Certificates</h4>
                <p>View all certificates stored in MySQL database with status tracking and cloud links</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;