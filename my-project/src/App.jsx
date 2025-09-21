import React, { useState, useEffect, lazy, Suspense } from "react";
// Essential components loaded immediately
import WalletDashboard from "./components/shared/WalletDashboard";
import { ethers } from "ethers";

// Lazy load components for code splitting
const ShardeumShowcase = lazy(() => import("./components/shared/ShardeumShowcase"));
const TransactionHistory = lazy(() => import("./components/shared/TransactionHistory"));
const TaskManagement = lazy(() => import("./components/admin/TaskManagement"));
const VotingSystem = lazy(() => import("./components/admin/VotingSystem"));
const ResourceBooking = lazy(() => import("./components/user/ResourceBooking"));
const UserTaskDashboard = lazy(() => import("./components/user/UserTaskDashboard"));
const Certificate = lazy(() => import("./components/certificates").then(module => ({ default: module.Certificate })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [userRole, setUserRole] = useState("User"); // Admin or User
  const [activeTab, setActiveTab] = useState("dashboard");
  const [txs, setTxs] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Admin address constant - Updated to correct admin address
  const ADMIN_ADDRESS = "0xaA16Eb82Cd4C39473101846c2975eAd10954cc50";

  // Determine role based on wallet address
  const determineUserRole = (address) => {
    return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? "Admin" : "User";
  };

  // Connect to wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed! Please install MetaMask to continue.");
      return;
    }
    
    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setAccount(address);

      // Automatically set role based on address
      const role = determineUserRole(address);
      setUserRole(role);

      const bal = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(bal);
      setBalance(formattedBalance);
      
      console.log(`✅ Wallet connected: ${address} (${role})`);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch/Disconnect wallet
  const switchWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Request account change
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
      
      // Get new account
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const newAddress = accounts[0];
      
      if (newAddress !== account) {
        setAccount(newAddress);
        
        // Automatically set role based on new address
        const role = determineUserRole(newAddress);
        setUserRole(role);
        
        const bal = await provider.getBalance(newAddress);
        const formattedBalance = ethers.formatEther(bal);
        setBalance(formattedBalance);
        
        // Clear transaction history for new account
        setTxs([]);
        setActiveTab("dashboard");
        
        console.log(`🔄 Wallet switched to: ${newAddress} (${role})`);
      }
    } catch (error) {
      console.error("Failed to switch wallet:", error);
      alert("Failed to switch wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount("");
    setBalance("");
    setUserRole("User");
    setTxs([]);
    setActiveTab("dashboard");
    console.log("🔌 Wallet disconnected");
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
            
            // Automatically set role based on address
            const role = determineUserRole(address);
            setUserRole(role);
            
            const bal = await provider.getBalance(address);
            const formattedBalance = ethers.formatEther(bal);
            setBalance(formattedBalance);
            
            console.log(`🔗 Auto-connected: ${address} (${role})`);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
      
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          const newAddress = accounts[0];
          setAccount(newAddress);
          
          // Automatically set role based on new address
          const role = determineUserRole(newAddress);
          setUserRole(role);
          
          // Update balance for new account
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            provider.getBalance(newAddress).then(bal => {
              setBalance(ethers.formatEther(bal));
            });
          }
          
          console.log(`🔄 Account changed to: ${newAddress} (${role})`);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [account]);

  // Removed conflicting role detection logic that was overriding admin address detection
  // Role is now properly set in connectWallet, switchWallet, and checkConnection functions

  // add txs when user sends
  const addTx = (tx) => {
    setTxs((prev) => {
      const existing = prev.filter((t) => t.hash !== tx.hash);
      return [tx, ...existing].slice(0, 10); // keep only last 10
    });
  };

  const menuItems = [
    { id: "dashboard", label: "🏠 Dashboard", roles: ["Admin", "User"] },
    // 🏆 Daily Achievements menu item commented out
    // { id: "achievements", label: "🏆 Daily Achievements", roles: ["Admin", "User"] },
    // ⚡ Shardeum Power moved to dashboard - menu item commented out
    // { id: "shardeum", label: "⚡ Shardeum Power", roles: ["Admin", "User"] },
    { id: "tasks", label: "📋 Task Management", roles: ["Admin", "User"] },
    { id: "certificates", label: "🎓 Certificates", roles: ["Admin", "User"] },
    { id: "voting", label: "🗳️ Voting", roles: ["Admin", "User"] },
    { id: "resources", label: "📅 Resource Booking", roles: ["User"] },
    { id: "transactions", label: "📊 Transaction History", roles: ["Admin", "User"] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Shardeum dApp Platform
                </h1>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-gray-500">Powered by Shardeum</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">0.3s avg</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600 font-medium">$0.001 gas</span>
                  </div>
                </div>
              </div>
            </div>
            
            {account && (
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  userRole === "Admin" 
                    ? "bg-red-100 text-red-800 border-red-200"   
                    : "bg-green-100 text-green-800 border-green-200"
                }`}>
                  {userRole === "Admin" ? "👑 Admin" : "👤 User"}
                  {userRole === "Admin" && (
                    <span className="ml-1 text-xs">(Auto-detected)</span>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {balance} SHM
                  </p>
                  <p className="text-xs text-gray-500">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    title="Disconnect wallet"
                  >
                    🔌 Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Security Notice for MetaMask Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>MetaMask Security Notice:</strong> This app is hosted on InfinityFree (shardeum.wuaze.com) and may trigger a "malicious site" warning in MetaMask. 
                This is a <strong>false positive</strong> common with free hosting services. The app is safe and only interacts with Shardeum blockchain for legitimate transactions. 
                <strong>All blockchain transactions have been disabled</strong> to prevent unwanted prompts - the app now operates in "backend-only" mode.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Shardeum's Lightning-Fast dApp Platform
              </h2>
              <p className="text-lg text-gray-600 mb-4 max-w-2xl">
                Experience the future of blockchain with Shardeum's revolutionary technology - 
                lightning-fast transactions, infinite scalability, and ultra-low gas fees.
              </p>
              
              {/* Admin Address Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">👑</span>
                  <h3 className="font-bold text-purple-800">Admin Access</h3>
                </div>
                <p className="text-sm text-purple-700 mb-2">
                  Connect with the admin wallet to access all admin features
                </p>
                <div className="bg-purple-100 rounded-lg p-2">
                  <p className="text-xs text-purple-600 font-mono">
                    Admin: {ADMIN_ADDRESS}
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  All other addresses will be assigned User role automatically
                </p>
              </div>
              
              {/* Shardeum Benefits Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl">⚡</span>
                    <h3 className="font-bold text-green-800">Lightning Speed</h3>
                  </div>
                  <p className="text-sm text-green-700">Sub-second transaction finality with instant confirmation</p>
                  <div className="mt-2 text-xs font-medium text-green-600">~0.5 seconds</div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl">🌐</span>
                    <h3 className="font-bold text-blue-800">Infinite Scalability</h3>
                  </div>
                  <p className="text-sm text-blue-700">Linear scaling with dynamic state sharding</p>
                  <div className="mt-2 text-xs font-medium text-blue-600">100k+ TPS capable</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl">💰</span>
                    <h3 className="font-bold text-purple-800">Ultra-Low Fees</h3>
                  </div>
                  <p className="text-sm text-purple-700">Minimal gas costs for all transactions</p>
                  <div className="mt-2 text-xs font-medium text-purple-600">~$0.001 per tx</div>
                </div>
              </div>
            </div>
            
            <WalletDashboard 
              setAccount={setAccount} 
              setBalance={setBalance}
            />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Task Management</h3>
                <p className="text-sm text-gray-600 mb-3">Create and complete tasks with blockchain verification</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="text-xs font-medium text-green-800">⚡ Instant on Shardeum</div>
                  <div className="text-xs text-green-600">Gas: ~$0.001</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Certificates</h3>
                <p className="text-sm text-gray-600 mb-3">Issue and verify digital certificates</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="text-xs font-medium text-blue-800">🌐 Scalable Storage</div>
                  <div className="text-xs text-blue-600">Unlimited capacity</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗳️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Voting System</h3>
                <p className="text-sm text-gray-600 mb-3">Participate in decentralized polls and voting</p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <div className="text-xs font-medium text-purple-800">💰 Low-Cost Voting</div>
                  <div className="text-xs text-purple-600">Democracy for all</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Resource Booking</h3>
                <p className="text-sm text-gray-600 mb-3">Book and manage shared resources</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="text-xs font-medium text-yellow-800">⚡ Real-time Updates</div>
                  <div className="text-xs text-yellow-600">Sub-second sync</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 bg-white rounded-xl shadow-lg p-6">
              <nav className="space-y-2">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Welcome back, {userRole}! 👋
                    </h2>
                    
                    {/* Shardeum Performance Metrics */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                        <h3 className="font-bold text-indigo-900">Shardeum Network Status</h3>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">🟢 Optimal</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">0.3s</div>
                          <div className="text-xs text-gray-600">Transaction Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">15,847</div>
                          <div className="text-xs text-gray-600">Current TPS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">$0.0008</div>
                          <div className="text-xs text-gray-600">Avg Gas Fee</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">99.9%</div>
                          <div className="text-xs text-gray-600">Network Uptime</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Wallet Balance</h3>
                        <p className="text-2xl font-bold text-blue-700">{balance} SHM</p>
                        <div className="text-xs text-blue-600 mt-1">Ultra-low fees save you money</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">Role & Access</h3>
                        <p className="text-2xl font-bold text-green-700">{userRole}</p>
                        <div className="text-xs text-green-600 mt-1">Instant role verification</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-2">Transactions</h3>
                        <p className="text-2xl font-bold text-purple-700">{txs.length}</p>
                        <div className="text-xs text-purple-600 mt-1">Lightning-fast confirmations</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shardeum Power Content Integrated into Dashboard */}
                  <Suspense fallback={<LoadingSpinner />}>
                    <ShardeumShowcase />
                  </Suspense>
                  
                  {/* 💸 Send Transaction section commented out */}
                  {/* <SendTransaction sender={account} onTx={addTx} /> */}
                </div>
              )}

              {/* 🏆 Daily Achievements page commented out */}
              {/* {activeTab === "achievements" && (
                <DailyAchievements />
              )} */}

              {/* ⚡ Shardeum Power moved to dashboard - route commented out */}
              {/* {activeTab === "shardeum" && (
                <ShardeumShowcase />
              )} */}

              {activeTab === "tasks" && (
                <Suspense fallback={<LoadingSpinner />}>
                  {userRole === "Admin" ? (
                    <TaskManagement 
                      userRole={userRole} 
                      account={account} 
                      onTx={addTx} 
                    />
                  ) : (
                    <UserTaskDashboard 
                      userRole={userRole} 
                      account={account} 
                      onTx={addTx} 
                    />
                  )}
                </Suspense>
              )}

              {activeTab === "certificates" && (
                <Suspense fallback={<LoadingSpinner />}>
                  <Certificate 
                    userRole={userRole} 
                    account={account} 
                  />
                </Suspense>
              )}

              {activeTab === "voting" && (
                <Suspense fallback={<LoadingSpinner />}>
                  <VotingSystem 
                    userRole={userRole} 
                    account={account} 
                    onTx={addTx} 
                  />
                </Suspense>
              )}

              {activeTab === "resources" && (
                <Suspense fallback={<LoadingSpinner />}>
                  <ResourceBooking 
                    userRole={userRole} 
                    account={account} 
                    onTx={addTx} 
                  />
                </Suspense>
              )}

              {activeTab === "transactions" && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <TransactionHistory account={account} />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
