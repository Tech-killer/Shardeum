import React, { useState, useEffect } from "react";

export default function ShardeumShowcase() {
  const [networkStats, setNetworkStats] = useState({
    tps: 15847,
    gasPrice: 0.0008,
    blockTime: 0.3,
    uptime: 99.9,
    totalTransactions: 2847392,
    activeValidators: 1247
  });

  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate real-time network statistics
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setNetworkStats(prev => ({
        ...prev,
        tps: 15000 + Math.floor(Math.random() * 5000),
        gasPrice: 0.0005 + Math.random() * 0.0005,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 100)
      }));
      
      setTimeout(() => setIsAnimating(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "⚡",
      title: "Lightning Speed",
      description: "Sub-second transaction finality",
      metric: `${networkStats.blockTime}s`,
      color: "from-yellow-400 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
      borderColor: "border-yellow-200"
    },
    {
      icon: "🌐",
      title: "Infinite Scalability", 
      description: "Linear scaling with dynamic sharding",
      metric: `${networkStats.tps.toLocaleString()} TPS`,
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50", 
      borderColor: "border-blue-200"
    },
    {
      icon: "💰",
      title: "Ultra-Low Fees",
      description: "Minimal gas costs for everyone",
      metric: `$${networkStats.gasPrice.toFixed(4)}`,
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      icon: "🔒",
      title: "99.9% Uptime",
      description: "Enterprise-grade reliability",
      metric: `${networkStats.uptime}%`,
      color: "from-purple-400 to-violet-500", 
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200"
    }
  ];

  const comparisons = [
    {
      feature: "Transaction Speed",
      shardeum: "0.3 seconds",
      ethereum: "15+ seconds",
      bitcoin: "10+ minutes"
    },
    {
      feature: "Gas Fees",
      shardeum: "$0.001",
      ethereum: "$5-50",
      bitcoin: "$1-10"
    },
    {
      feature: "TPS Capacity",
      shardeum: "100,000+",
      ethereum: "15",
      bitcoin: "7"
    },
    {
      feature: "Energy Efficiency",
      shardeum: "99% less",
      ethereum: "High",
      bitcoin: "Very High"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            ⚡ Powered by Shardeum's Revolutionary Blockchain
          </h2>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">
            Experience the future of blockchain technology with lightning-fast transactions, 
            infinite scalability, and ultra-low fees that make Web3 accessible to everyone.
          </p>
        </div>

        {/* Live Network Stats */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-semibold">Live Network Statistics</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold transition-all duration-500 ${isAnimating ? 'scale-110 text-yellow-300' : ''}`}>
                {networkStats.tps.toLocaleString()}
              </div>
              <div className="text-sm opacity-80">TPS</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold transition-all duration-500 ${isAnimating ? 'scale-110 text-green-300' : ''}`}>
                ${networkStats.gasPrice.toFixed(4)}
              </div>
              <div className="text-sm opacity-80">Gas Fee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{networkStats.blockTime}s</div>
              <div className="text-sm opacity-80">Block Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{networkStats.uptime}%</div>
              <div className="text-sm opacity-80">Uptime</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold transition-all duration-500 ${isAnimating ? 'scale-110 text-blue-300' : ''}`}>
                {networkStats.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm opacity-80">Total Txs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{networkStats.activeValidators}</div>
              <div className="text-sm opacity-80">Validators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-br ${feature.bgColor} border ${feature.borderColor} rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
          >
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
              <div className={`text-2xl font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                {feature.metric}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🏆 Shardeum vs Traditional Blockchains
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-emerald-600">
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Shardeum</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Ethereum</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Bitcoin</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-semibold py-1 px-3 rounded-full text-sm">
                      {row.shardeum}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">{row.ethereum}</td>
                  <td className="py-4 px-4 text-center text-gray-600">{row.bitcoin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🌟 Why Choose Shardeum?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🚀</span>
              <h4 className="font-semibold text-gray-900">Developer Friendly</h4>
            </div>
            <p className="text-gray-600 text-sm">
              EVM compatibility means your existing Ethereum dApps work seamlessly on Shardeum 
              with better performance and lower costs.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🌍</span>
              <h4 className="font-semibold text-gray-900">Global Accessibility</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Ultra-low fees make blockchain technology accessible to users worldwide, 
              regardless of economic status or transaction size.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔮</span>
              <h4 className="font-semibold text-gray-900">Future-Proof</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Dynamic state sharding ensures the network grows with demand, 
              maintaining performance as adoption increases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}