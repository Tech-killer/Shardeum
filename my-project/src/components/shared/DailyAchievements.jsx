import React, { useState } from "react";

export default function DailyAchievements() {
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [copiedNetwork, setCopiedNetwork] = useState("");

  // Copy to clipboard function
  const copyToClipboard = (text, networkName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNetwork(networkName);
      setTimeout(() => setCopiedNetwork(""), 2000);
    });
  };

  // Add network to MetaMask
  const addToMetaMask = async (networkConfig) => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask to add network.");
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
      alert(`${networkConfig.chainName} network added to MetaMask successfully!`);
    } catch (error) {
      console.error("Error adding network to MetaMask:", error);
      alert(`Failed to add ${networkConfig.chainName} network to MetaMask. Please add manually.`);
    }
  };

  // Network configurations
  const networks = {
    mainnet: {
      chainId: '0x1FB6', // 8118 in hex
      chainName: 'Shardeum',
      nativeCurrency: {
        name: 'SHM',
        symbol: 'SHM',
        decimals: 18,
      },
      rpcUrls: ['https://api.shardeum.org'],
      blockExplorerUrls: ['https://explorer.shardeum.org'],
    },
    unstablenet: {
      chainId: '0x1F90', // 8080 in hex
      chainName: 'Shardeum Unstablenet',
      nativeCurrency: {
        name: 'SHM',
        symbol: 'SHM',
        decimals: 18,
      },
      rpcUrls: ['https://api-unstable.shardeum.org'],
      blockExplorerUrls: ['https://explorer-unstable.shardeum.org/'],
    }
  };

  const achievements = [
    {
      title: "🏗️ Complete dApp Architecture",
      description: "Built a comprehensive blockchain platform with multiple components",
      details: [
        "React-based frontend with modern UI/UX",
        "MetaMask integration for wallet connectivity",
        "Role-based access control (Admin/User)",
        "Modular component architecture"
      ],
      time: "2 hours",
      status: "✅ Completed"
    },
    {
      title: "📋 Task Management System",
      description: "Implemented full-featured task management with blockchain integration",
      details: [
        "Task creation and assignment functionality",
        "Status tracking (Open → In Progress → Completed)",
        "Blockchain transaction integration with MetaMask",
        "Real-time task updates and filtering"
      ],
      time: "3 hours",
      status: "✅ Completed"
    },
    {
      title: "💰 Payment & Transaction System",
      description: "Complete blockchain payment integration with optimized performance",
      details: [
        "MetaMask transaction processing",
        "0.0001 SHM payment implementation",
        "Fast transaction confirmation (1-3 seconds)",
        "Error handling and user feedback"
      ],
      time: "1.5 hours",
      status: "✅ Completed"
    },
    {
      title: "� Transaction History & Analytics",
      description: "Comprehensive transaction tracking and analysis system",
      details: [
        "Real-time transaction monitoring from backend API",
        "Advanced filtering (All, Sent, Received, Pending, Completed)",
        "Status change timing analysis (only for tasks changed from 'open')",
        "Hide 'open' status transactions from history"
      ],
      time: "1.5 hours",
      status: "✅ Completed"
    },
    {
      title: "� Wallet Integration & Management",
      description: "Seamless MetaMask wallet connectivity and management",
      details: [
        "Auto-connect functionality",
        "Balance tracking and updates",
        "Multi-account support with role detection",
        "Network switching capabilities"
      ],
      time: "1 hour",
      status: "✅ Completed"
    },
    {
      title: "🎓 Certificate Management",
      description: "Digital certificate system (Basic Implementation)",
      details: [
        "Basic certificate component structure",
        "UI layout for certificate display",
        "Placeholder for certificate functionality",
        "Integration ready for blockchain proof"
      ],
      time: "0.5 hours",
      status: "🟡 Partially Implemented"
    },
    {
      title: "🗳️ Voting System",
      description: "Decentralized voting platform (Basic Structure)",
      details: [
        "Basic voting component framework",
        "UI structure for poll creation",
        "Vote casting interface placeholder",
        "Results display layout"
      ],
      time: "0.5 hours",
      status: "🟡 Partially Implemented"
    },
    {
      title: "� Resource Booking",
      description: "Resource management system (Basic Framework)",
      details: [
        "Basic booking component structure",
        "Resource listing interface",
        "Booking form placeholder",
        "Calendar integration ready"
      ],
      time: "0.5 hours",
      status: "🟡 Partially Implemented"
    }
  ];

  const totalHours = achievements.reduce((sum, achievement) => {
    return sum + parseFloat(achievement.time);
  }, 0);

  const completedFeatures = achievements.filter(a => a.status.includes('✅')).length;
  const partialFeatures = achievements.filter(a => a.status.includes('🟡')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 Daily Development Achievements</h1>
            <p className="text-purple-100 text-lg">
              Comprehensive Shardeum dApp Platform - {completedFeatures} features completed, {partialFeatures} partially implemented
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">⏱️ Total Time: {totalHours} hours</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">✅ Completed: {completedFeatures}</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">🟡 Partial: {partialFeatures}</span>
              </div>
            </div>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
      </div>

      {/* Shardeum Network Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-3xl mr-3">🌐</span>
            Shardeum Network Configuration
          </h2>
          <button
            onClick={() => setShowNetworkDetails(!showNetworkDetails)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showNetworkDetails ? 'Hide Details' : 'Show Network Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Mainnet Card */}
          <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-800 flex items-center">
                <span className="text-2xl mr-2">🟢</span>
                Shardeum Mainnet
              </h3>
              <button
                onClick={() => addToMetaMask(networks.mainnet)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                + Add to MetaMask
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Network Name:</span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded">Shardeum</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Chain ID:</span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded">8118</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">🟢 Production Ready</span>
              </div>
            </div>
          </div>

          {/* Unstablenet Card */}
          <div className="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-orange-800 flex items-center">
                <span className="text-2xl mr-2">🧪</span>
                Shardeum Unstablenet
              </h3>
              <button
                onClick={() => addToMetaMask(networks.unstablenet)}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                + Add to MetaMask
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Network Name:</span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded">Shardeum Unstablenet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Chain ID:</span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded">8080</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">🧪 Smart Contract Testnet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Network Information */}
        {showNetworkDetails && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Detailed Network Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mainnet Details */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="text-lg mr-2">🟢</span>
                  Shardeum Mainnet Configuration
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Network Name:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">Shardeum</code>
                      <button
                        onClick={() => copyToClipboard("Shardeum", "mainnet-name")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "mainnet-name" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">RPC URL:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://api.shardeum.org</code>
                      <button
                        onClick={() => copyToClipboard("https://api.shardeum.org", "mainnet-rpc")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "mainnet-rpc" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Chain ID:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">8118</code>
                      <button
                        onClick={() => copyToClipboard("8118", "mainnet-chain")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "mainnet-chain" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Block Explorer:</span>
                    <div className="flex items-center space-x-2">
                      <a 
                        href="https://explorer.shardeum.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-xs underline"
                      >
                        explorer.shardeum.org
                      </a>
                      <button
                        onClick={() => copyToClipboard("https://explorer.shardeum.org", "mainnet-explorer")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "mainnet-explorer" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unstablenet Details */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-bold text-orange-800 mb-3 flex items-center">
                  <span className="text-lg mr-2">🧪</span>
                  Shardeum Unstablenet Configuration
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Network Name:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">Shardeum Unstablenet</code>
                      <button
                        onClick={() => copyToClipboard("Shardeum Unstablenet", "unstable-name")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "unstable-name" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">RPC URL:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://api-unstable.shardeum.org</code>
                      <button
                        onClick={() => copyToClipboard("https://api-unstable.shardeum.org", "unstable-rpc")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "unstable-rpc" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Chain ID:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">8080</code>
                      <button
                        onClick={() => copyToClipboard("8080", "unstable-chain")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "unstable-chain" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Block Explorer:</span>
                    <div className="flex items-center space-x-2">
                      <a 
                        href="https://explorer-unstable.shardeum.org/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-xs underline"
                      >
                        explorer-unstable.shardeum.org
                      </a>
                      <button
                        onClick={() => copyToClipboard("https://explorer-unstable.shardeum.org/", "unstable-explorer")}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy to clipboard"
                      >
                        {copiedNetwork === "unstable-explorer" ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Troubleshooting */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                Network Configuration Troubleshooting
              </h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>RPC Connection Issues:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Try switching between Mainnet (8118) and Unstablenet (8080)</li>
                  <li>Clear browser cache and restart MetaMask</li>
                  <li>Ensure you're using the correct RPC URLs provided above</li>
                  <li>Check if your region has access to Shardeum endpoints</li>
                  <li>Use the "Add to MetaMask" buttons for automatic configuration</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{achievement.title}</h3>
              <span className={`text-sm px-2 py-1 rounded-full ${
                achievement.status.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {achievement.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{achievement.description}</p>
            
            <div className="space-y-2 mb-4">
              {achievement.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="flex items-start space-x-2">
                  <span className={`text-sm ${
                    achievement.status.includes('✅') ? 'text-green-500' : 'text-yellow-500'
                  }`}>•</span>
                  <span className="text-sm text-gray-700">{detail}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-blue-600">⏱️ {achievement.time}</span>
              <span className="text-xs text-gray-500">Development Time</span>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Stack */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">🛠️</span>
          Technical Stack & Implementation
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-3">Frontend Technologies</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• React 18 with Hooks</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Modern ES6+ JavaScript</li>
              <li>• Responsive design principles</li>
              <li>• Component-based architecture</li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-3">Blockchain Integration</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Ethers.js for Web3 connectivity</li>
              <li>• MetaMask wallet integration</li>
              <li>• Shardeum network support</li>
              <li>• Smart contract interactions</li>
              <li>• Transaction monitoring</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-bold text-purple-800 mb-3">Key Features</h3>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>• Multi-role user system</li>
              <li>• Real-time transaction tracking</li>
              <li>• Advanced filtering & search</li>
              <li>• Responsive mobile design</li>
              <li>• Production-ready code</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">🎉 Project Completion Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">{totalHours}h</div>
              <div className="text-sm">Development Time</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">{completedFeatures}</div>
              <div className="text-sm">Completed Features</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">{partialFeatures}</div>
              <div className="text-sm">Partial Features</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">{Math.round((completedFeatures / achievements.length) * 100)}%</div>
              <div className="text-sm">Completion Rate</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">2</div>
              <div className="text-sm">Networks Supported</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}