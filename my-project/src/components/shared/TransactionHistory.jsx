import React, { useState, useEffect } from "react";

export default function TransactionHistory({ account }) {
  const [txHistory, setTxHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, sent, received, pending

  console.log("🔄 TransactionHistory component rendered with account:", account);

  // Fetch transactions from backend
  useEffect(() => {
    console.log("🔄 TransactionHistory useEffect triggered, account:", account);
    console.log("🔄 Loading transaction history regardless of account status...");
    loadTransactionHistory();
  }, [account]);

  const loadTransactionHistory = async () => {
    setLoading(true);
    console.log("🔄 Starting loadTransactionHistory - fetching from transition.php");
    
    try {
      console.log("📡 Fetching transaction history from remote backend...");
      
      const response = await fetch("https://shardeum.wuaze.com/backend/transition.php").catch(err => {
        console.error("❌ Transition.php fetch error:", err);
        return { json: () => ({ success: false, error: err.message }) };
      });

      const data = await response.json();
      console.log("✅ Raw API response:", data);
      console.log("🔍 Raw API response success:", data.success);
      console.log("🔍 Raw API response transactions count:", data.transactions?.length);

      let allTransactions = [];
      let completedTasks = [];

      if (data.success && data.transactions) {
        console.log(`📊 Processing ${data.transactions.length} transactions from transition.php`);
        
        // Debug: Log all transactions with their status
        console.log("🔍 All transactions with status:");
        data.transactions.forEach((tx, index) => {
          const isCompleted = tx.status === 'completed';
          console.log(`  ${index + 1}. Task ID: ${tx.id}, Title: "${tx.title}", Status: "${tx.status}", isCompleted: ${isCompleted}, Assignee: "${tx.assignee}"`);
        });
        
        // Filter completed tasks first for verification
        completedTasks = data.transactions.filter(tx => tx.status === 'completed' || tx.status === 'approved');
        console.log(`🎯 Found ${completedTasks.length} completed tasks in raw data`);
        
        // Log detailed information about completed tasks
        if (completedTasks.length > 0) {
          console.log("🏆 COMPLETED TASKS DETAILS FROM API:");
          completedTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. "${task.title}" (ID: ${task.id})`);
            console.log(`     Status: ${task.status}`);
            console.log(`     Assignee: ${task.assignee || 'None'}`);
            console.log(`     Creator: ${task.creator || 'Unknown'}`);
            console.log(`     Created: ${task.created_at}`);
            console.log(`     Transaction Type: ${task.transaction_type}`);
            console.log(`     Description: ${task.description}`);
            console.log(`     Reward: ${task.reward_amount} ${task.reward_token}`);
            console.log(`     Blockchain Proof: ${task.blockchain_proof}`);
            console.log(`     ---`);
          });
        } else {
          console.log("⚠️ No completed tasks found in the API data");
          console.log("🔍 Checking what statuses are present:");
          const statusCounts = {};
          data.transactions.forEach(tx => {
            statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;
          });
          console.log("📊 Status distribution:", statusCounts);
        }

        // Process all transactions
        data.transactions.forEach((tx) => {
          // Calculate task duration if available and status changed from 'open'
          let duration = null;
          let hasStatusChanged = false;
          let showTiming = false;
          
          // Check if task was initially 'open' and now has a different status
          const initialStatus = tx.initial_status || tx.original_status || 'open'; // Fallback to 'open' if not provided
          const currentStatus = tx.status || 'pending';
          
          hasStatusChanged = initialStatus === 'open' && currentStatus !== 'open';
          showTiming = hasStatusChanged;
          
          if (tx.created_at && showTiming) {
            const createdTime = new Date(tx.created_at);
            const completedTime = tx.completed_at ? new Date(tx.completed_at) : new Date();
            duration = Math.abs(completedTime - createdTime);
          }
          
          const isCompleted = tx.status === 'completed' || tx.status === 'approved';
          console.log(`🔄 Processing transaction ID ${tx.id}: status="${tx.status}", isCompleted=${isCompleted}, hasStatusChanged=${hasStatusChanged}, showTiming=${showTiming}`);
          
          const processedTransaction = {
            id: `transaction_${tx.id}`,
            hash: tx.blockchain_proof || `task_${tx.id}_${Date.now()}`,
            type: tx.transaction_type || "Task Transaction",
            amount: parseFloat(tx.reward_amount || 0.0001),
            usd: tx.usd_value || "$0.00",
            status: tx.status || "pending",
            timestamp: new Date(tx.created_at || Date.now()),
            createdAt: new Date(tx.created_at || Date.now()),
            from: tx.creator || "System",
            to: tx.assignee || account,
            taskId: tx.task_id || tx.id,
            action: tx.title || tx.description || "Task Transaction",
            source: "transition.php",
            duration: duration,
            isCompleted: isCompleted,
            transactionType: tx.transaction_type,
            description: tx.description,
            initialStatus: initialStatus,
            hasStatusChanged: hasStatusChanged,
            showTiming: showTiming
          };
          
          if (isCompleted) {
            console.log(`🏆 PROCESSED COMPLETED TRANSACTION:`, processedTransaction);
          }
          
          allTransactions.push(processedTransaction);
        });
        
        console.log(`✅ Added ${allTransactions.length} total transactions from transition.php`);
        
        // Debug completed transactions after processing
        const completedTransactions = allTransactions.filter(tx => tx.isCompleted);
        console.log(`🎯 ${completedTransactions.length} transactions marked as completed after processing`);
        
        if (completedTransactions.length > 0) {
          console.log("🏆 PROCESSED COMPLETED TRANSACTIONS:");
          completedTransactions.forEach((tx, index) => {
            console.log(`  ${index + 1}. "${tx.action}" (Task ID: ${tx.taskId})`);
            console.log(`     Status: ${tx.status}`);
            console.log(`     isCompleted: ${tx.isCompleted}`);
            console.log(`     Amount: ${tx.amount} SHM`);
            console.log(`     Type: ${tx.transactionType}`);
            console.log(`     Hash: ${tx.hash}`);
            console.log(`     ---`);
          });
        }
        
      } else {
        console.log("❌ No valid transaction data from transition.php");
        console.log("🔍 Response data:", data);
      }

      // Sort newest first
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Separate completed tasks for detailed analysis
      const completedTransactions = allTransactions.filter(tx => tx.isCompleted);
      const otherTransactions = allTransactions.filter(tx => !tx.isCompleted);
      
      console.log(`🎉 Final result: ${allTransactions.length} total transactions loaded`);
      console.log(`🎯 Completed transactions: ${completedTransactions.length}`);
      console.log(`📊 Other transactions: ${otherTransactions.length}`);
      
      // Log detailed completed task analysis
      if (completedTransactions.length > 0) {
        console.log("🏆 COMPLETED TASKS ANALYSIS:");
        completedTransactions.forEach((tx, index) => {
          const durationText = tx.duration ? 
            `${Math.floor(tx.duration / (1000 * 60 * 60))}h ${Math.floor((tx.duration % (1000 * 60 * 60)) / (1000 * 60))}m` : 
            'Unknown duration';
          
          console.log(`  ${index + 1}. "${tx.action}" (ID: ${tx.taskId})`);
          console.log(`     Created: ${tx.createdAt.toLocaleString()}`);
          console.log(`     Transaction Type: ${tx.transactionType}`);
          console.log(`     Duration: ${durationText}`);
          console.log(`     Assignee: ${tx.to}`);
          console.log(`     Creator: ${tx.from}`);
          console.log(`     Reward: ${tx.amount} SHM`);
          console.log(`     Blockchain Proof: ${tx.hash}`);
          console.log(`     ---`);
        });
        
        // Calculate average completion time
        const validDurations = completedTransactions.filter(tx => tx.duration).map(tx => tx.duration);
        if (validDurations.length > 0) {
          const avgDuration = validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
          console.log(`📊 Average completion time: ${Math.floor(avgDuration / (1000 * 60 * 60))}h ${Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60))}m`);
        }
        
        // Calculate total rewards earned
        const totalRewards = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`💰 Total rewards earned: ${totalRewards.toFixed(4)} SHM`);
      }
      
      // Add test completed task for debugging
      if (allTransactions.length > 0) {
        console.log("🧪 Adding test completed task for debugging");
        allTransactions.push({
          id: `test_completed_${Date.now()}`,
          hash: `test_hash_${Date.now()}`,
          type: "task_completed",
          amount: 0.0001,
          usd: "$0.00",
          status: "completed",
          timestamp: new Date(),
          createdAt: new Date(),
          from: "Test Creator",
          to: account,
          taskId: "test_task_123",
          action: "🧪 TEST: Complete Website Redesign",
          source: "test",
          duration: 3600000, // 1 hour
          isCompleted: true,
          transactionType: "task_completed",
          description: "This is a test completed task to verify the display",
          initialStatus: "open",
          hasStatusChanged: true,
          showTiming: true
        });
        console.log("✅ Test completed task added successfully");
      }

      setTxHistory(allTransactions);
      
      console.log(`✅ setTxHistory called with ${allTransactions.length} transactions`);
      const completedInProcessed = allTransactions.filter(tx => tx.isCompleted || tx.status === 'completed');
      console.log(`🎯 Completed transactions in processed data: ${completedInProcessed.length}`);
      
      if (completedInProcessed.length > 0) {
        console.log("🏆 COMPLETED TRANSACTIONS STORED:");
        completedInProcessed.forEach((tx, index) => {
          console.log(`  ${index + 1}. "${tx.action}" - Status: ${tx.status}, isCompleted: ${tx.isCompleted}, ID: ${tx.id}`);
        });
      }

      if (allTransactions.length > 0) {
        console.log("📋 Sample transaction:", allTransactions[0]);
      }
    } catch (error) {
      console.error("❌ Error loading transaction history:", error);
      setTxHistory([]); // Set empty array on error
    } finally {
      setLoading(false);
      console.log("✅ loadTransactionHistory completed");
    }
  };

  const getFilteredTransactions = () => {
    console.log(`🔍 Getting filtered transactions with filter: "${filter}"`);
    console.log(`📊 Total transactions available: ${txHistory.length}`);
    
    // First, filter out all transactions with "open" status
    const nonOpenTransactions = txHistory.filter(tx => tx.status !== "open");
    console.log(`🚫 Filtered out open transactions: ${txHistory.length - nonOpenTransactions.length} hidden, ${nonOpenTransactions.length} remaining`);
    
    let filtered;
    switch (filter) {
      case "sent":
        filtered = nonOpenTransactions.filter(tx => tx.from?.toLowerCase() === account?.toLowerCase());
        break;
      case "received":
        filtered = nonOpenTransactions.filter(tx => tx.to?.toLowerCase() === account?.toLowerCase());
        break;
      case "pending":
        filtered = nonOpenTransactions.filter(tx => tx.status === "pending" || (!tx.isCompleted && tx.status !== 'completed'));
        break;
      case "completed":
        filtered = nonOpenTransactions.filter(tx => tx.status === "completed" || tx.status === "approved" || tx.isCompleted);
        console.log(`🎯 Completed filter applied: ${filtered.length} transactions found`);
        console.log("🏆 Completed transactions details:");
        filtered.forEach((tx, index) => {
          console.log(`  ${index + 1}. "${tx.action}" - Status: "${tx.status}", isCompleted: ${tx.isCompleted}, Task ID: ${tx.taskId}`);
        });
        break;
      default:
        filtered = nonOpenTransactions;
        break;
    }
    
    console.log(`✅ Filtered result: ${filtered.length} transactions (${txHistory.filter(tx => tx.status === "open").length} open transactions hidden)`);
    return filtered;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "✅";
      case "pending": return "⏳";
      case "failed": return "❌";
      default: return "📄";
    }
  };

  const formatAmount = (amount) => parseFloat(amount || 0).toFixed(4);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (duration) => {
    if (!duration) return "Unknown";
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const openInExplorer = (hash) => {
    const explorerUrl = `https://explorer.shardeum.org/transaction/${hash}`;
    window.open(explorerUrl, "_blank");
  };

  const filteredTransactions = getFilteredTransactions();
  
  // Debug logging for current state
  console.log(`🎯 Current filter: "${filter}"`);
  console.log(`📊 Total txHistory length: ${txHistory.length}`);
  console.log(`� Open status transactions (hidden): ${txHistory.filter(tx => tx.status === "open").length}`);
  console.log(`�📋 Filtered transactions length: ${filteredTransactions.length}`);
  console.log(`🏆 Completed transactions in txHistory: ${txHistory.filter(tx => (tx.status === "completed" || tx.status === "approved" || tx.isCompleted) && tx.status !== "open").length}`);
  
  if (filter === "completed") {
    console.log("🔍 COMPLETED FILTER ACTIVE - Debugging:");
    console.log(`  - Filter is: ${filter}`);
    console.log(`  - txHistory has ${txHistory.length} total transactions`);
    console.log(`  - filteredTransactions has ${filteredTransactions.length} transactions`);
    console.log(`  - Open transactions hidden: ${txHistory.filter(tx => tx.status === "open").length}`);
    
    txHistory.filter(tx => tx.status !== "open").forEach((tx, index) => {
      const isCompleted = tx.status === "completed" || tx.status === "approved" || tx.isCompleted;
      console.log(`  ${index + 1}. "${tx.action}" - Status: "${tx.status}", isCompleted: ${tx.isCompleted}, shouldShow: ${isCompleted}`);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        <button
          onClick={loadTransactionHistory}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors mr-2"
        >
          🔄 Refresh
        </button>
        <button
          onClick={async () => {
            console.log("🔄 FORCE RELOAD: Starting fresh data load...");
            setLoading(true);
            setTxHistory([]); // Clear existing data
            
            try {
              const response = await fetch("https://shardeum.wuaze.com/backend/transition.php");
              const data = await response.json();
              console.log("🔄 FORCE RELOAD: Raw response:", data);
              
              if (data.success && data.transactions) {
                console.log(`🔄 FORCE RELOAD: Processing ${data.transactions.length} transactions`);
                
                const completed = data.transactions.filter(tx => tx.status === 'completed' || tx.status === 'approved');
                console.log(`🏆 FORCE RELOAD: Found ${completed.length} completed tasks in raw data`);
                
                // Process the data immediately
                const processed = data.transactions.map(tx => {
                  // Calculate task duration if available and status changed from 'open'
                  let duration = null;
                  let hasStatusChanged = false;
                  let showTiming = false;
                  
                  // Check if task was initially 'open' and now has a different status
                  const initialStatus = tx.initial_status || tx.original_status || 'open'; // Fallback to 'open' if not provided
                  const currentStatus = tx.status || 'pending';
                  
                  hasStatusChanged = initialStatus === 'open' && currentStatus !== 'open';
                  showTiming = hasStatusChanged;
                  
                  if (tx.created_at && showTiming) {
                    const createdTime = new Date(tx.created_at);
                    const completedTime = tx.completed_at ? new Date(tx.completed_at) : new Date();
                    duration = Math.abs(completedTime - createdTime);
                  }
                  
                  return {
                    id: `transaction_${tx.id}`,
                    hash: tx.blockchain_proof || `task_${tx.id}_${Date.now()}`,
                    type: tx.transaction_type || "Task Transaction",
                    amount: parseFloat(tx.reward_amount || 0.0001),
                    usd: tx.usd_value || "$0.00",
                    status: tx.status || "pending",
                    timestamp: new Date(tx.created_at || Date.now()),
                    createdAt: new Date(tx.created_at || Date.now()),
                    from: tx.creator || "System",
                    to: tx.assignee || account || "user",
                    taskId: tx.task_id || tx.id,
                    action: tx.title || tx.description || "Task Transaction",
                    source: "transition.php",
                    isCompleted: tx.status === 'completed' || tx.status === 'approved',
                    transactionType: tx.transaction_type,
                    description: tx.description,
                    duration: duration,
                    initialStatus: initialStatus,
                    hasStatusChanged: hasStatusChanged,
                    showTiming: showTiming
                  };
                });
                
                console.log(`🔄 FORCE RELOAD: Processed ${processed.length} transactions`);
                const processedCompleted = processed.filter(tx => tx.isCompleted);
                console.log(`🏆 FORCE RELOAD: ${processedCompleted.length} processed as completed`);
                
                setTxHistory(processed);
                setFilter("completed");
                
                setTimeout(() => {
                  console.log("� FORCE RELOAD: Setting filter to completed and checking...");
                  console.log(`Final txHistory length: ${processed.length}`);
                }, 500);
              }
            } catch (error) {
              console.error("❌ FORCE RELOAD Error:", error);
            } finally {
              setLoading(false);
            }
          }}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
        >
          🔄 Force Reload & Test
        </button>
        <button
          onClick={() => {
            console.log("🔍 MANUAL COMPLETED FILTER TEST:");
            console.log(`📊 Current txHistory length: ${txHistory.length}`);
            console.log(`📊 Current filter: "${filter}"`);
            
            // Test filtering manually
            const manualFiltered = txHistory.filter(tx => tx.status === "completed" || tx.status === "approved" || tx.isCompleted);
            console.log(`🎯 Manual filter result: ${manualFiltered.length} completed transactions`);
            
            if (manualFiltered.length > 0) {
              console.log("🏆 Manual filter found these completed transactions:");
              manualFiltered.forEach((tx, index) => {
                console.log(`  ${index + 1}. "${tx.action}" - Status: "${tx.status}", isCompleted: ${tx.isCompleted}`);
              });
            } else {
              console.log("⚠️ Manual filter found NO completed transactions");
              console.log("📋 All transactions in txHistory:");
              txHistory.slice(0, 5).forEach((tx, index) => {
                console.log(`  ${index + 1}. "${tx.action}" - Status: "${tx.status}", isCompleted: ${tx.isCompleted}`);
              });
            }
            
            // Now set the filter to completed
            console.log("🔄 Setting filter to 'completed'...");
            setFilter("completed");
          }}
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors ml-2"
        >
          🔍 Test Completed Filter
        </button>
      </div>

      {/* Completed Tasks Summary */}
      {!loading && filteredTransactions.filter(tx => tx.isCompleted || tx.status === "completed" || tx.status === "approved").length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
            🏆 Completed Tasks Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter(tx => tx.isCompleted || tx.status === "completed" || tx.status === "approved").length}
              </div>
              <div className="text-sm text-green-700">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const completedTasks = filteredTransactions.filter(tx => (tx.isCompleted || tx.status === "completed" || tx.status === "approved") && tx.duration && tx.showTiming);
                  if (completedTasks.length === 0) return "N/A";
                  const avgDuration = completedTasks.reduce((sum, tx) => sum + tx.duration, 0) / completedTasks.length;
                  return formatDuration(avgDuration);
                })()}
              </div>
              <div className="text-sm text-green-700">Avg Completion Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(
                  filteredTransactions
                    .filter(tx => tx.isCompleted || tx.status === "completed" || tx.status === "approved")
                    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
                )} SHM
              </div>
              <div className="text-sm text-green-700">Total Rewards</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-1 mb-4">
        {[
          { key: "all", label: "All", count: txHistory.filter(tx => tx.status !== "open").length },
          { key: "sent", label: "Sent", count: txHistory.filter(tx => tx.from?.toLowerCase() === account?.toLowerCase() && tx.status !== "open").length },
          { key: "received", label: "Received", count: txHistory.filter(tx => tx.to?.toLowerCase() === account?.toLowerCase() && tx.status !== "open").length },
          { key: "pending", label: "Pending", count: txHistory.filter(tx => (tx.status === "pending" || (!tx.isCompleted && tx.status !== 'completed')) && tx.status !== "open").length },
          { key: "completed", label: "Completed", count: txHistory.filter(tx => (tx.status === "completed" || tx.status === "approved" || tx.isCompleted) && tx.status !== "open").length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      )}

      {/* Transaction List */}
      {!loading && (
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm mt-1">Complete some tasks to see your transaction history</p>
            </div>
          ) : filteredTransactions.map(tx => {
            console.log(`🎭 Rendering transaction: "${tx.action}" - Status: "${tx.status}", isCompleted: ${tx.isCompleted}`);
            return (
              <div
                key={tx.id || tx.hash}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openInExplorer(tx.hash)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎁</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">{tx.action}</h3>
                        <span className="text-lg">{getStatusIcon(tx.status)}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {tx.transactionType || tx.type}
                        </span>
                        {(tx.isCompleted || tx.status === 'completed' || tx.status === 'approved') && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            🏆 COMPLETED TASK
                          </span>
                        )}
                        {tx.description && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {tx.description}
                          </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {tx.taskId && `Task #${tx.taskId} • `}
                      {tx.isCompleted ? `Completed ${formatTimestamp(tx.timestamp)}` : formatTimestamp(tx.timestamp)}
                      {tx.isCompleted && tx.duration && tx.showTiming && (
                        <span className="ml-2 text-purple-600 font-medium">
                          ⏱️ Duration: {formatDuration(tx.duration)}
                        </span>
                      )}
                      {tx.hasStatusChanged && (
                        <span className="ml-2 text-blue-600 text-xs">
                          📊 Status changed from '{tx.initialStatus}' to '{tx.status}'
                        </span>
                      )}
                    </p>
                    {tx.isCompleted && tx.createdAt && (
                      <p className="text-xs text-gray-500">
                        Started: {tx.createdAt.toLocaleDateString()} {tx.createdAt.toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-mono">
                      {tx.hash ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}` : 'No hash'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg ${tx.to?.toLowerCase() === account?.toLowerCase() ? "text-green-600" : "text-red-600"}`}>
                    {tx.to?.toLowerCase() === account?.toLowerCase() ? "+" : "-"}{formatAmount(tx.amount)} SHM
                  </div>
                  <div className="text-xs text-gray-600">{tx.usd}</div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                    tx.status === "completed" ? "bg-green-100 text-green-800" : tx.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                +{formatAmount(
                  filteredTransactions
                    .filter(tx => tx.to?.toLowerCase() === account?.toLowerCase() && tx.status !== "open")
                    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
                )} SHM
              </div>
              <div className="text-sm text-gray-600">Received</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                -{formatAmount(
                  filteredTransactions
                    .filter(tx => tx.from?.toLowerCase() === account?.toLowerCase() && tx.status !== "open")
                    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
                )} SHM
              </div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {filteredTransactions.length}
              </div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
          </div>
          {txHistory.filter(tx => tx.status === "open").length > 0 && (
            <div className="text-center mt-2 text-sm text-gray-500">
              ({txHistory.filter(tx => tx.status === "open").length} open tasks hidden from history)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
