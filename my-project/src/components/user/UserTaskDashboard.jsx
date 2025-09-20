import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";

const API_BASE_URL = "http://localhost/hackethon/user.php";

export default function UserTaskDashboard({ account, onTx }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [forceUpdate, setForceUpdate] = useState(0); // Add force update trigger
  const currentUser = account;

  // Fetch tasks from backend
  const fetchTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL, {
        headers: { "x-user-address": currentUser },
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      } else {
        alert("Failed to fetch tasks: " + data.message);
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log("🐛 DEBUG - Current State:");
    console.log("  - Current User:", currentUser);
    console.log("  - Active Tab:", activeTab);
    console.log("  - Total Tasks:", tasks.length);
    console.log("  - All Tasks:", tasks.map(t => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee,
      status: t.status
    })));
  };

  // Add debug logging when tasks or activeTab changes
  useEffect(() => {
    debugCurrentState();
  }, [tasks, activeTab]);

  // Accept task
  const acceptTask = async (taskId) => {
    if (taskActionLoading) return;
    setTaskActionLoading(true);
    try {
      if (!window.ethereum) throw new Error("Connect wallet first");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const recipient = "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4";

      // Deduct 1 SHM for acceptance
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther("1"),
      });
      if (onTx) onTx({ hash: tx.hash, pending: true, action: "Accept Task" });
      await tx.wait();
      if (onTx) onTx({ hash: tx.hash, pending: false, action: "Accept Task" });

      // Update backend
      console.log(`🔄 Updating backend for task ${taskId}...`);
      console.log(`Task ID type: ${typeof taskId}, value: ${taskId}`);
      
      const res = await fetch(`${API_BASE_URL}?task_id=${taskId}&action=accept`, {
        method: "PATCH",
        headers: { "x-user-address": currentUser, "Content-Type": "application/json" },
      });
      const data = await res.json();
      console.log("Backend response:", data);
      
      if (!data.success) throw new Error(data.message);

      // ⚡ IMMEDIATE CRITICAL TASK UPDATE - Multiple aggressive approaches
      // ⚡ CRITICAL: Create updated tasks array immediately
      const currentTasksSnapshot = tasks;
      const immediateUpdatedTasks = currentTasksSnapshot.map(task => {
        if (String(task.id) === String(taskId)) {
          const newTask = {
            ...task,
            assignee: currentUser,
            status: "in_progress",
            ...(data.task || {}) // Merge any backend data
          };
          console.log(`🎯 IMMEDIATE SYNC UPDATE: Task ${taskId}`, newTask);
          return newTask;
        }
        return task;
      });
      
      console.log("✅ Created immediate updated tasks array:", immediateUpdatedTasks);
      
      // Apply the update synchronously
      setTasks(immediateUpdatedTasks);
      
      // Verify immediately
      const verifyTask = immediateUpdatedTasks.find(t => String(t.id) === String(taskId));
      console.log("🔍 IMMEDIATE SYNC VERIFICATION:", verifyTask);
      
      if (!verifyTask || verifyTask.status !== "in_progress") {
        console.error("🚨 IMMEDIATE SYNC UPDATE FAILED!");
      } else {
        console.log("✅ IMMEDIATE SYNC UPDATE SUCCESS!");
      }
      
      // Force tab switch and re-render
      setActiveTab("pending");
      setForceUpdate(prev => prev + 1);
      
      console.log("🔄 Immediate sync update completed, tab switched, re-render triggered");
      
      // Approach 3: Backup verification and force fix
      setTimeout(() => {
        console.log("� BACKUP: Verifying and forcing task update if needed...");
        setTasks(currentTasks => {
          const task = currentTasks.find(t => String(t.id) === String(taskId));
          
          if (!task) {
            console.error("🚨 BACKUP: Task not found!");
            return currentTasks;
          }
          
          if (task.status !== "in_progress" || task.assignee !== currentUser) {
            console.log("🆘 BACKUP: Force fixing task status");
            return currentTasks.map(t => 
              String(t.id) === String(taskId) 
                ? { ...t, assignee: currentUser, status: "in_progress" }
                : t
            );
          }
          
          console.log("✅ BACKUP: Task is correct");
          return currentTasks;
        });
      }, 100);
      
      // Final backup - reload from backend after 1 second
      setTimeout(() => {
        console.log("🔄 FINAL SAFETY CHECK: Verifying task status...");
        
        // Check current state before deciding to reload
        setTasks(currentTasks => {
          const targetTask = currentTasks.find(t => String(t.id).trim() === String(taskId).trim());
          
          if (!targetTask || targetTask.status !== "in_progress" || targetTask.assignee !== currentUser) {
            console.log("🔄 FINAL BACKUP: Task still not updated correctly, reloading from backend...");
            // Reload in the next tick to avoid state conflicts
            setTimeout(() => fetchTasks(), 0);
          } else {
            console.log("✅ FINAL CHECK: Task is correctly updated, no reload needed");
          }
          
          return currentTasks;
        });
      }, 1000);
      
      alert("✅ Task accepted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to accept task: " + err.message);
    } finally {
      setTaskActionLoading(false);
    }
  };

  // Complete task
  const completeTask = async (taskId) => {
    if (taskActionLoading) return;
    setTaskActionLoading(true);
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found");

      // Optional reward payment
      const reward = task.reward_amount || task.reward?.amount;
      if (reward && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: currentUser,
          value: ethers.parseEther(reward.toString()),
        });
        if (onTx) onTx({ hash: tx.hash, pending: true, action: "Task Complete Reward" });
        await tx.wait();
        if (onTx) onTx({ hash: tx.hash, pending: false, action: "Task Complete Reward" });
      }

      // Update backend
      const res = await fetch(`${API_BASE_URL}?task_id=${taskId}&action=complete`, {
        method: "PATCH",
        headers: { "x-user-address": currentUser, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Update state immediately
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t))
      );
      setActiveTab("completed");
      alert("✅ Task completed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to complete task: " + err.message);
    } finally {
      setTaskActionLoading(false);
    }
  };

  // Filter tasks per tab - include forceUpdate to trigger re-evaluation
  const filteredTasks = useMemo(() => {
    console.log(`🔄 Re-filtering tasks for tab "${activeTab}" (forceUpdate: ${forceUpdate})`);
    
    return tasks.filter((t) => {
      let shouldInclude = false;
      
      switch (activeTab) {
        case "available":
          shouldInclude = (!t.assignee || t.assignee === "") && (!t.status || t.status === "open");
          break;
        case "pending":
          shouldInclude = t.assignee === currentUser && t.status === "in_progress";
          break;
        case "completed":
          shouldInclude = t.assignee === currentUser && t.status === "completed";
          break;
        default:
          shouldInclude = true;
      }
      
      // Debug logging for task filtering
      if (String(t.id).trim() === "4" || console.log) { // Always log for task 4, or when debugging is enabled
        console.log(`🔍 Filtering task ${t.id} for tab "${activeTab}":`, {
          taskId: t.id,
          assignee: t.assignee,
          status: t.status,
          currentUser: currentUser,
          shouldInclude: shouldInclude,
          tab: activeTab,
          assigneeMatch: t.assignee === currentUser,
          statusCheck: t.status === "in_progress"
        });
      }
      
      return shouldInclude;
    });
  }, [tasks, activeTab, currentUser, forceUpdate]);

  // Debug the filtered results
  console.log(`📊 Tab "${activeTab}" - Total tasks: ${tasks.length}, Filtered tasks: ${filteredTasks.length}`);
  console.log("Filtered task IDs:", filteredTasks.map(t => t.id));

  return (
    <div className="space-y-6">
      {!currentUser ? (
        <div className="text-center py-12">
          <h3>Connect your wallet to see tasks</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border">
          {/* Tabs */}
          <nav className="flex space-x-8 border-b px-6">
            {["available", "pending", "completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 ${
                  activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <button
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                fetchTasks();
              }}
              className="py-4 px-2 text-gray-500 hover:text-blue-600 text-sm"
              title="Refresh tasks"
            >
              🔄 Refresh
            </button>
            <button
              onClick={debugCurrentState}
              className="py-4 px-2 text-gray-500 hover:text-blue-600 text-sm"
              title="Debug current state"
            >
              🐛 Debug
            </button>
          </nav>

          {/* Tasks */}
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No tasks found.</p>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{task.title}</h4>
                    <p>{task.description}</p>
                    {(task.reward_amount || task.reward?.amount) && (
                      <div className="text-sm text-gray-500 mt-1">
                        Reward: {task.reward_amount || task.reward?.amount}{" "}
                        {task.reward_token || task.reward?.token}
                      </div>
                    )}
                  </div>
                  <div>
                    {activeTab === "available" && (
                      <button
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                        onClick={() => acceptTask(task.id)}
                        disabled={taskActionLoading}
                      >
                        Accept Task (-1 SHM)
                      </button>
                    )}
                    {activeTab === "pending" && (
                      <button
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                        onClick={() => completeTask(task.id)}
                        disabled={taskActionLoading}
                      >
                        Mark Complete
                      </button>
                    )}
                    {activeTab === "completed" && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">✅ Completed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
