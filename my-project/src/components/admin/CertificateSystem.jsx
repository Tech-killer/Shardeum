import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function CertificateSystem({ userRole, account, onTx }) {
  const [certificates, setCertificates] = useState([
    {
      id: 1,
      title: "Blockchain Development Certificate",
      recipient: "0x456...def",
      issuer: "0x123...abc",
      hash: "QmX5Y6Z...",
      issuedAt: "2024-01-15",
      verified: true,
    },
    {
      id: 2,
      title: "Smart Contract Security Audit",
      recipient: "0x789...ghi",
      issuer: "0x123...abc",
      hash: "QmA1B2C...",
      issuedAt: "2024-01-14",
      verified: true,
    },
  ]);

  const [newCertificate, setNewCertificate] = useState({
    title: "",
    recipient: "",
    description: "",
  });

  const [verificationHash, setVerificationHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0.0");
  const [gasEstimate, setGasEstimate] = useState("0.001");

  // Safety mechanism to prevent stuck loading states
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("⚠️ Loading timeout - force resetting button state");
        setLoading(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Emergency reset function
  const forceResetLoading = () => {
    console.log("🔄 Manual loading state reset");
    setLoading(false);
  };

  // Get real-time balance
  useEffect(() => {
    const updateBalance = async () => {
      if (account && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const bal = await provider.getBalance(account);
          setBalance(ethers.formatEther(bal));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    updateBalance();
    const interval = setInterval(updateBalance, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [account]);

  const issueCertificate = async () => {
    if (!newCertificate.title || !newCertificate.recipient || !newCertificate.description) {
      alert("Please fill in all fields");
      return;
    }

    if (!ethers.isAddress(newCertificate.recipient)) {
      alert("Please enter a valid recipient address");
      return;
    }

    // Prevent double-clicks and ensure clean state
    if (loading) {
      console.log("Already processing transaction...");
      return;
    }

    let timeoutId;
    
    try {
      setLoading(true);
      
      // Set an aggressive timeout to reset loading state
      timeoutId = setTimeout(() => {
        console.log("🛑 Force resetting loading state after 10 seconds");
        setLoading(false);
      }, 10000);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Generate certificate hash
      const certificateData = {
        title: newCertificate.title,
        recipient: newCertificate.recipient,
        description: newCertificate.description,
        issuer: account,
        timestamp: Date.now(),
      };
      
      const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(certificateData)));
      
      // Store current form data before clearing
      const currentTitle = newCertificate.title;
      const currentRecipient = newCertificate.recipient;
      
      // Simple transaction - no complex gas estimation
      const tx = await signer.sendTransaction({
        to: newCertificate.recipient,
        value: ethers.parseEther("0.001"),
        data: ethers.toUtf8Bytes(`CERT:${hash.slice(0, 16)}`),
      });

      // Clear timeout since transaction was successful
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // IMMEDIATELY reset loading state - don't wait for anything
      setLoading(false);
      
      // Clear form immediately
      setNewCertificate({ title: "", recipient: "", description: "" });
      
      // Create certificate in UI immediately
      const certificate = {
        id: Date.now(),
        title: currentTitle,
        recipient: currentRecipient,
        issuer: account,
        hash: hash.slice(0, 10) + "...",
        issuedAt: new Date().toISOString().split('T')[0],
        verified: false,
        pending: true,
      };

      setCertificates(prev => [certificate, ...prev]);

      // Log transaction for tracking
      if (onTx) {
        onTx({
          hash: tx.hash,
          from: account,
          to: currentRecipient,
          value: "0.001",
          pending: true,
          action: "Issue Certificate",
          details: currentTitle,
          timestamp: new Date().toISOString(),
          gasUsed: "21000",
          estimatedUSDFee: 0.001,
          confirmTime: 300,
        });
      }
      
      alert("🚀 Certificate transaction sent! Check your wallet for confirmation.");

      // Handle confirmation separately without affecting UI
      tx.wait(1).then((receipt) => {
        console.log("✅ Transaction confirmed:", receipt.hash);
        
        // Update certificate status
        setCertificates(prev => 
          prev.map(cert => 
            cert.id === certificate.id 
              ? { ...cert, verified: true, pending: false, blockNumber: receipt.blockNumber }
              : cert
          )
        );

        // Update transaction log
        if (onTx) {
          onTx({
            hash: tx.hash,
            from: account,
            to: currentRecipient,
            value: "0.001",
            pending: false,
            action: "Issue Certificate",
            details: currentTitle,
            timestamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString(),
            estimatedUSDFee: 0.001,
            confirmTime: 300,
            blockNumber: receipt.blockNumber,
          });
        }

        // Update balance
        provider.getBalance(account).then(newBalance => {
          setBalance(ethers.formatEther(newBalance));
        }).catch(console.error);

      }).catch((confirmError) => {
        console.error("Confirmation failed:", confirmError);
        // Mark certificate as failed
        setCertificates(prev => 
          prev.map(cert => 
            cert.id === certificate.id 
              ? { ...cert, verified: false, pending: false, failed: true }
              : cert
          )
        );
      });

    } catch (err) {
      console.error("Transaction failed:", err);
      
      // Clear any timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Force reset loading state
      setLoading(false);
      
      alert("❌ Failed to issue certificate: " + (err.reason || err.message || "Unknown error"));
    }
  };

  const verifyCertificate = async () => {
    if (!verificationHash) {
      alert("Please enter a certificate hash");
      return;
    }

    // Prevent double-clicks
    if (loading) {
      console.log("Already processing verification...");
      return;
    }

    let timeoutId;

    try {
      setLoading(true);
      
      // Aggressive timeout for verification
      timeoutId = setTimeout(() => {
        console.log("🛑 Force resetting verification loading state");
        setLoading(false);
      }, 5000);
      
      // Fast verification process
      const foundCertificate = certificates.find(cert => 
        cert.hash.toLowerCase().includes(verificationHash.toLowerCase().slice(0, 8))
      );

      if (foundCertificate) {
        setVerificationResult({
          valid: true,
          certificate: foundCertificate,
        });
        
        // Optional blockchain verification
        if (window.ethereum) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            const tx = await signer.sendTransaction({
              to: account,
              value: ethers.parseEther("0.0005"),
              data: ethers.toUtf8Bytes(`VERIFY:${verificationHash.slice(0, 10)}`),
            });

            // Log verification transaction
            if (onTx) {
              onTx({
                hash: tx.hash,
                from: account,
                to: account,
                value: "0.0005",
                pending: false,
                action: "Verify Certificate",
                details: `Hash: ${verificationHash.slice(0, 10)}...`,
                timestamp: new Date().toISOString(),
                gasUsed: "21000",
                estimatedUSDFee: 0.0005,
                confirmTime: 300,
              });
            }

            // Update balance after delay
            setTimeout(() => {
              provider.getBalance(account).then(newBalance => {
                setBalance(ethers.formatEther(newBalance));
              }).catch(console.error);
            }, 1000);
            
          } catch (txError) {
            console.error("Verification transaction failed:", txError);
            // Continue with verification even if transaction fails
          }
        }

      } else {
        setVerificationResult({
          valid: false,
          message: "Certificate not found or invalid hash",
        });
      }
      
      // Clear timeout and reset loading IMMEDIATELY
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setLoading(false);
      
    } catch (err) {
      console.error("Verification failed:", err);
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Force reset loading
      setLoading(false);
      
      alert("❌ Verification failed: " + (err.reason || err.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance & Network Status */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">💎 Your SHM Balance</h3>
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold">{parseFloat(balance).toFixed(4)} SHM</span>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                <span className="text-sm font-medium">≈ ${(parseFloat(balance) * 0.45).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Shardeum Network</span>
            </div>
            <div className="text-sm opacity-90">
              ⚡ 0.3s confirmations • 💰 ~$0.001 gas
            </div>
          </div>
        </div>
        
        {/* Gas Estimate for Certificate Operations */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="flex items-center justify-between text-sm">
            <span>Certificate Issuance Cost:</span>
            <span className="font-medium">~{gasEstimate} SHM (~$0.001)</span>
          </div>
        </div>
      </div>
      {/* Admin: Issue Certificate */}
      {userRole === "Admin" && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">👑</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Issue New Certificate</h3>
              <p className="text-sm text-gray-600">Admin Panel - Issue digital certificates on blockchain</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Title</label>
              <input
                type="text"
                value={newCertificate.title}
                onChange={(e) => setNewCertificate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Blockchain Development Certificate"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
              <input
                type="text"
                value={newCertificate.recipient}
                onChange={(e) => setNewCertificate(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="0x..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newCertificate.description}
                onChange={(e) => setNewCertificate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Certificate description and achievements"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <button
              onClick={issueCertificate}
              disabled={loading || parseFloat(balance) < 0.002}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing on Shardeum...</span>
                </div>
              ) : parseFloat(balance) < 0.002 ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>⚠️</span>
                  <span>Insufficient SHM Balance</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🎓</span>
                  <span>Issue Certificate (~0.001 SHM)</span>
                </div>
              )}
            </button>

            {/* Emergency Reset Button */}
            {loading && (
              <button
                onClick={forceResetLoading}
                className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
              >
                🔄 Reset Button (if stuck)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Certificate Verification */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🔍</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Verify Certificate</h3>
            <p className="text-sm text-gray-600">Enter certificate hash to verify authenticity</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Hash</label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={verificationHash}
                onChange={(e) => setVerificationHash(e.target.value)}
                placeholder="Enter certificate hash (e.g., QmX5Y6Z...)"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={verifyCertificate}
                disabled={loading || !verificationHash || parseFloat(balance) < 0.001}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : parseFloat(balance) < 0.001 ? (
                  "⚠️ Low Balance"
                ) : (
                  "🔍 Verify (~0.0005 SHM)"
                )}
              </button>
            </div>
          </div>

          {verificationResult && (
            <div className={`border rounded-lg p-4 ${
              verificationResult.valid 
                ? "border-green-200 bg-green-50" 
                : "border-red-200 bg-red-50"
            }`}>
              {verificationResult.valid ? (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-semibold text-green-800">Certificate Verified!</span>
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Title:</strong> {verificationResult.certificate.title}</p>
                    <p><strong>Recipient:</strong> {verificationResult.certificate.recipient}</p>
                    <p><strong>Issuer:</strong> {verificationResult.certificate.issuer}</p>
                    <p><strong>Issued:</strong> {verificationResult.certificate.issuedAt}</p>
                    <p><strong>Hash:</strong> {verificationResult.certificate.hash}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 text-xl">❌</span>
                  <span className="font-semibold text-red-800">{verificationResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificate List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎓</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Issued Certificates</h3>
              <p className="text-sm text-gray-600">
                {userRole === "Admin" ? "Certificates you have issued" : "View all issued certificates"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Certificates</p>
            <p className="text-2xl font-bold text-purple-600">{certificates.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{cert.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cert.failed
                        ? "bg-red-100 text-red-800"
                        : cert.pending
                        ? "bg-yellow-100 text-yellow-800 animate-pulse"
                        : cert.verified 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {cert.failed 
                        ? "❌ Failed"
                        : cert.pending
                        ? "⏳ Confirming..."
                        : cert.verified 
                        ? "✅ Verified" 
                        : "⏳ Pending"}
                    </span>
                    {cert.blockNumber && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Block #{cert.blockNumber}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>👤</span>
                      <span>Recipient: {cert.recipient.slice(0, 6)}...{cert.recipient.slice(-4)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🏢</span>
                      <span>Issuer: {cert.issuer.slice(0, 6)}...{cert.issuer.slice(-4)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>Issued: {cert.issuedAt}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">Hash:</span> {cert.hash}
                  </div>
                </div>

                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => setVerificationHash(cert.hash)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                  >
                    📋 Copy Hash
                  </button>
                </div>
              </div>
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates</h3>
              <p className="text-gray-600">
                {userRole === "Admin" 
                  ? "Issue your first certificate to get started" 
                  : "No certificates have been issued yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}