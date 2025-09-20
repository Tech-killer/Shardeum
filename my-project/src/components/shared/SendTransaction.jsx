import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function SendTransaction({ sender, onTx }) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4");
  const [loading, setLoading] = useState(false);

  // Safety mechanism to prevent stuck loading states
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("⚠️ SendTransaction: Force resetting button state");
        setLoading(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Emergency reset function
  const forceResetLoading = () => {
    console.log("🔄 Manual reset of SendTransaction loading state");
    setLoading(false);
  };

  const sendTransaction = async () => {
    // Prevent double-clicks
    if (loading) {
      console.log("Transaction already in progress...");
      return;
    }

    const startTime = Date.now();
    let timeoutId;
    
    try {
      setLoading(true);
      
      // Set aggressive timeout for this specific transaction
      timeoutId = setTimeout(() => {
        console.log("🛑 SendTransaction: Force resetting after 10 seconds");
        setLoading(false);
      }, 10000);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Store current values before clearing
      const currentAmount = amount;
      const currentRecipient = recipient;

      const tx = await signer.sendTransaction({
        to: currentRecipient,
        value: ethers.parseEther(currentAmount),
      });

      const sendTime = Date.now() - startTime;

      // Clear timeout since transaction was sent successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // IMMEDIATELY reset loading state and clear form
      setLoading(false);
      setAmount("");

      // Add as pending transaction
      if (onTx) {
        onTx({
          hash: tx.hash,
          from: sender,
          to: currentRecipient,
          value: currentAmount,
          pending: true,
          timestamp: new Date().toISOString(),
          startTime: startTime,
          sendTime: sendTime,
        });
      }

      alert(`🚀 Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`);

      // Handle confirmation asynchronously without blocking UI
      tx.wait(1).then((receipt) => {
        const confirmTime = Date.now() - startTime;

        // Calculate gas fees
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice;
        const gasFeeEth = ethers.formatEther(gasUsed * gasPrice);
        const estimatedUSDFee = parseFloat(gasFeeEth) * 2000; // Assuming ETH price for demo

        console.log(`✅ Transaction confirmed in ${(confirmTime/1000).toFixed(2)}s`);

        // Update transaction as confirmed
        if (onTx) {
          onTx({
            hash: tx.hash,
            from: sender,
            to: currentRecipient,
            value: currentAmount,
            pending: false,
            timestamp: new Date().toISOString(),
            confirmTime: confirmTime,
            gasUsed: gasUsed.toString(),
            gasPrice: gasPrice.toString(),
            gasFeeEth: gasFeeEth,
            estimatedUSDFee: estimatedUSDFee,
            blockNumber: receipt.blockNumber,
          });
        }

        // Show success notification
        alert(`✅ Transaction confirmed in ${(confirmTime/1000).toFixed(2)}s!\n💰 Gas fee: ~$${estimatedUSDFee.toFixed(4)}\n⚡ Powered by Shardeum!`);

      }).catch((confirmError) => {
        console.error("Transaction confirmation failed:", confirmError);
        alert("⚠️ Transaction sent but confirmation failed. Check explorer for status.");
      });

    } catch (err) {
      console.error("Transaction failed:", err);
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Force reset loading state
      setLoading(false);
      
      alert("❌ Transaction failed: " + (err.reason || err.message || "Unknown error"));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg">💸</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Send Transaction</h2>
          <p className="text-sm text-gray-600">Transfer SHM tokens to another wallet</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Address</label>
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-sm font-mono text-gray-600">{sender}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount (SHM)</label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all pr-16"
            />
            <span className="absolute right-3 top-3 text-gray-500 font-medium">SHM</span>
          </div>
        </div>

        <button
          onClick={sendTransaction}
          disabled={loading || !amount || !recipient || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Transaction...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🚀</span>
              <span>Send Transaction</span>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">⚡</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Powered by Shardeum's Revolutionary Technology</p>
              <ul className="space-y-1 text-blue-700">
                <li>• ⚡ Lightning-fast confirmations in ~0.3 seconds</li>
                <li>• 💰 Ultra-low gas fees (~$0.001 per transaction)</li>
                <li>• 🌐 Infinite scalability with dynamic sharding</li>
                <li>• 🔗 View transaction details in Shardeum explorer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
