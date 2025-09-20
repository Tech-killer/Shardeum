import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function WalletDashboard({ setAccount, setBalance }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed! Please install MetaMask to continue.");
      return;
    }
    
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setAccount(address);

      const bal = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(bal);
      setBalance(formattedBalance);
      setConnected(true);
      
      console.log("✅ Wallet connected:", address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const address = accounts[0].address;
            setAccount(address);
            const bal = await provider.getBalance(address);
            const formattedBalance = ethers.formatEther(bal);
            setBalance(formattedBalance);
            setConnected(true);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
      
    checkConnection();
  }, [setAccount, setBalance]);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">🦊</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect to Shardeum Network
          </h2>
          <p className="text-gray-600 mb-4">
            Experience lightning-fast transactions with ultra-low fees
          </p>
          
          {/* Shardeum Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-600 font-bold text-lg">⚡ 0.3s</div>
              <div className="text-xs text-green-700">Speed</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-blue-600 font-bold text-lg">💰 $0.001</div>
              <div className="text-xs text-blue-700">Gas Fee</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-purple-600 font-bold text-lg">🌐 ∞</div>
              <div className="text-xs text-purple-700">Scalable</div>
            </div>
          </div>

          {!connected ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🔗</span>
                  <span>Connect MetaMask</span>
                </div>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <span>✅</span>
                  <span className="font-medium">Wallet Connected</span>
                </div>
              </div>
              
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "🔄 Refresh Connection"}
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-500">🔒 Your wallet connection is secure and encrypted</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-sm font-medium text-indigo-900 mb-1">
                  🚀 Powered by Shardeum's Revolutionary Technology
                </div>
                <div className="text-xs text-indigo-700">
                  EVM-compatible • Linear scaling • Ultra-low fees
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
