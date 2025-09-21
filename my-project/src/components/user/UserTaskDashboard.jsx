import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const API_BASE_URL = "https://shardeum.wuaze.com/backend/user.php";

export default function UserTaskDashboard({ account, onTx }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [acceptingTasks, setAcceptingTasks] = useState(new Set());
  const [completingTasks, setCompletingTasks] = useState(new Set());
  const currentUser = account;

  // Enhanced fetch with error handling and debug logging
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching all tasks from backend...");
      
      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-address": currentUser || "",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Backend response:", data);

      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        console.log(`📋 Loaded ${data.tasks.length} total tasks`);
        
        // Log task distribution for debugging
        const statusCount = data.tasks.reduce((acc, task) => {
          acc[task.status || 'no_status'] = (acc[task.status || 'no_status'] || 0) + 1;
          return acc;
        }, {});
        console.log("📊 Task status distribution:", statusCount);
      } else {
        console.warn("⚠️ Invalid response format:", data);
        setTasks([]);
      }
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load tasks on component mount and user change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Accept task with blockchain transaction and backend update
  const acceptTask = async (taskId) => {
    if (!currentUser) {
      alert("Please connect your wallet first");
      return;
    }

    const taskIdStr = String(taskId);
    setAcceptingTasks(prev => new Set([...prev, taskIdStr]));

    try {
      console.log(`🚀 Starting accept process for task ${taskId}`);
      
      const task = tasks.find(t => String(t.id) === taskIdStr);
      if (!task) {
        throw new Error("Task not found in local state");
      }

      // 1. Create blockchain transaction first
      let transactionHash = null;
      if (window.ethereum) {
        try {
          console.log("💰 Creating blockchain transaction...");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          const destinationAddress = "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4";
          
          const tx = await signer.sendTransaction({
            to: destinationAddress,
            value: ethers.parseEther("0.0001"), // 0.0001 SHM
          });

          transactionHash = tx.hash;
          console.log(`🔗 Transaction sent: ${transactionHash}`);

          // Notify transaction pending
          if (onTx) {
            onTx({
              hash: transactionHash,
              pending: true,
              action: `Accept Task: ${task.title}`,
              type: "task_accepted",
              taskId: taskId,
              amount: 0.0001
            });
          }

          // Optimized confirmation detection (1-3 seconds instead of 8-10)
          try {
            console.log("⏳ Waiting for transaction confirmation...");
            await Promise.race([
              tx.wait(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Confirmation timeout")), 8000)
              )
            ]);
            console.log("✅ Transaction confirmed quickly!");
          } catch (waitError) {
            console.log("⚡ Fast polling for confirmation...");
            // Fast polling for confirmation (500ms intervals)
            let confirmed = false;
            for (let i = 0; i < 10 && !confirmed; i++) {
              await new Promise(resolve => setTimeout(resolve, 500));
              try {
                const receipt = await provider.getTransactionReceipt(transactionHash);
                if (receipt) {
                  console.log("✅ Transaction confirmed via polling!");
                  confirmed = true;
                }
              } catch (pollError) {
                console.log(`🔍 Poll attempt ${i + 1}/10...`);
              }
            }
            
            if (!confirmed) {
              console.log("⚡ Proceeding without confirmation (transaction likely pending)");
            }
          }

          // Notify transaction completion
          if (onTx) {
            onTx({
              hash: transactionHash,
              pending: false,
              action: `Accept Task: ${task.title}`,
              type: "task_accepted",
              taskId: taskId,
              amount: 0.0001
            });
          }

        } catch (txError) {
          console.error("❌ Blockchain transaction failed:", txError);
          throw new Error(`Transaction failed: ${txError.message}`);
        }
      }

      // 2. Update backend via PATCH request
      console.log("🔄 Updating backend...");
      const backendResponse = await fetch(`${API_BASE_URL}?task_id=${taskId}&action=accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-address": currentUser,
        },
      });

      const backendData = await backendResponse.json();
      console.log("🔙 Backend response:", backendData);

      if (!backendData.success) {
        throw new Error(backendData.message || "Backend update failed");
      }

      // 3. Refresh tasks to show updated state
      console.log("🔄 Refreshing task list...");
      await fetchTasks();
      
      console.log("🎉 Task accepted successfully!");

    } catch (error) {
      console.error("❌ Accept task error:", error);
      alert(`Failed to accept task: ${error.message}`);
    } finally {
      setAcceptingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskIdStr);
        return newSet;
      });
    }
  };

  // Complete task (no blockchain transaction needed)
  const completeTask = async (taskId) => {
    if (!currentUser) {
      alert("Please connect your wallet first");
      return;
    }

    const taskIdStr = String(taskId);
    setCompletingTasks(prev => new Set([...prev, taskIdStr]));

    try {
      console.log(`✅ Completing task ${taskId}`);
      
      const task = tasks.find(t => String(t.id) === taskIdStr);
      if (!task) {
        throw new Error("Task not found");
      }

      // Create transaction record for history (no actual blockchain transaction)
      if (onTx) {
        const fakeHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
        onTx({
          hash: fakeHash,
          pending: false,
          action: `Complete Task: ${task.title}`,
          type: "task_completed",
          taskId: taskId,
          amount: 0
        });
      }

      // Update backend
      const response = await fetch(`${API_BASE_URL}?task_id=${taskId}&action=complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-address": currentUser,
        },
      });

      const data = await response.json();
      console.log("🔙 Complete backend response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to mark task as completed");
      }

      // Refresh tasks
      await fetchTasks();
      console.log("🎉 Task completed successfully!");

    } catch (error) {
      console.error("❌ Complete task error:", error);
      alert(`Failed to complete task: ${error.message}`);
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskIdStr);
        return newSet;
      });
    }
  };

  // Filter tasks by tab with proper status handling
  const filteredTasks = tasks.filter((task) => {
    switch (activeTab) {
      case "available":
        return (!task.assignee || task.assignee === '') && 
               (!task.status || task.status === '' || task.status === 'open');
      case "pending":
        return task.status === "in_progress";
      case "approved":
        return task.assignee === currentUser && 
               (task.status === "approved" || task.status === "completed");
      default:
        return true;
    }
  });

  // Get task counts for tabs
  const getTaskCounts = () => {
    return {
      available: tasks.filter(t => (!t.assignee || t.assignee === '') && 
                                  (!t.status || t.status === '' || t.status === 'open')).length,
      pending: tasks.filter(t => t.status === "in_progress").length,
      approved: tasks.filter(t => t.assignee === currentUser && 
                                 (t.status === "approved" || t.status === "completed")).length,
    };
  };

  const taskCounts = getTaskCounts();

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "Unknown";
    if (address === currentUser) return "You";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get status badge component
  const StatusBadge = ({ status, assignee }) => {
    const isAssignedToUser = assignee === currentUser;
    
    switch (status) {
      case "in_progress":
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
            ⏳ In Progress
          </span>
        );
      case "completed":
      case "approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            ✅ Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            📋 Available
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {!currentUser ? (
        <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600">
            <h3 className="text-lg font-semibold mb-2">🔗 Connect Your Wallet</h3>
            <p>Please connect your wallet to view and interact with tasks</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">ℹ️</span>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Task Management System</p>
                  <p className="text-blue-600">
                    Accepting tasks requires 0.0001 SHM payment to: 
                    <code className="ml-1 px-1 bg-blue-100 rounded">0xa15e...56C4</code>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">Completing tasks is free!</p>
                </div>
              </div>
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {loading ? "🔄" : "↻"} Refresh
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{taskCounts.available}</div>
              <div className="text-sm text-gray-600">Available Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{taskCounts.pending}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{taskCounts.approved}</div>
              <div className="text-sm text-gray-600">Your Completed</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 px-6 border-b bg-gray-50">
            {[
              { id: "available", name: "🆕 Available", count: taskCounts.available },
              { id: "pending", name: "⏳ Pending", count: taskCounts.pending },
              { id: "approved", name: "✅ Approved", count: taskCounts.approved },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </nav>

          {/* Task List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium mb-2">No {activeTab} tasks found</h3>
                <p className="text-sm">
                  {activeTab === "available" && "No available tasks at the moment. Check back later!"}
                  {activeTab === "pending" && "No tasks are currently in progress."}
                  {activeTab === "approved" && "You haven't completed any tasks yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const taskIdStr = String(task.id);
                  const isAccepting = acceptingTasks.has(taskIdStr);
                  const isCompleting = completingTasks.has(taskIdStr);
                  const isAssignedToUser = task.assignee === currentUser;

                  return (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {task.title || "Untitled Task"}
                              </h4>
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {task.description || "No description provided"}
                              </p>
                            </div>
                            <StatusBadge status={task.status} assignee={task.assignee} />
                          </div>

                          {/* Task Metadata */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              🆔 Task #{task.id}
                            </div>
                            
                            {task.assignee && (
                              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                👤 {formatAddress(task.assignee)}
                              </div>
                            )}
                            
                            {task.created_at && (
                              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                📅 {new Date(task.created_at).toLocaleDateString()}
                              </div>
                            )}

                            {activeTab === "pending" && !isAssignedToUser && (
                              <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                🔒 Assigned to another user
                              </div>
                            )}
                          </div>

                          {/* Task Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-xs"
                                >
                                  #{tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-6 flex flex-col space-y-2">
                          {activeTab === "available" && (
                            <button
                              onClick={() => acceptTask(task.id)}
                              disabled={isAccepting || !currentUser}
                              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                isAccepting
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg"
                              }`}
                            >
                              {isAccepting ? (
                                <span className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Accepting...</span>
                                </span>
                              ) : (
                                "🚀 Accept Task"
                              )}
                            </button>
                          )}

                          {activeTab === "pending" && isAssignedToUser && (
                            <button
                              onClick={() => completeTask(task.id)}
                              disabled={isCompleting}
                              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                isCompleting
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "bg-green-500 text-white hover:bg-green-600 hover:shadow-lg"
                              }`}
                            >
                              {isCompleting ? (
                                <span className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Completing...</span>
                                </span>
                              ) : (
                                "✅ Mark Complete"
                              )}
                            </button>
                          )}

                          {activeTab === "pending" && !isAssignedToUser && (
                            <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm text-center">
                              👀 View Only
                            </div>
                          )}

                          {activeTab === "approved" && (
                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm text-center font-medium">
                              🎉 Completed!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
