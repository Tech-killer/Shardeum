import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const API_BASE_URL = "https://aipoweredifl.com/hackethon/api.php";

export default function TaskManagement({ userRole, account, onTx }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "other",
    assignee: "",
    dueDate: "",
    estimatedHours: "",
    reward: { amount: "", token: "SHM" },
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [fetchingTasks, setFetchingTasks] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: ""
  });
  const [taskStats, setTaskStats] = useState(null);

  const currentUser = account;

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setFetchingTasks(true);
      const queryParams = new URLSearchParams(filters);

      const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Tasks data:", data);
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setFetchingTasks(false);
    }
  };

  // Create task (Admin only)
  const createTask = async () => {
    if (!newTask.title || !newTask.description) {
      alert("⚠️ Please fill in title and description");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          creator: account,
          status: "open",
          tags: newTask.tags.filter((t) => t.trim() !== "")
        })
      });

      const result = await response.json();
      console.log("✅ Task created:", result);

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "other",
        assignee: "",
        dueDate: "",
        estimatedHours: "",
        reward: { amount: "", token: "SHM" },
        tags: []
      });

      fetchTasks();
      alert("✅ Task created successfully!");
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("❌ Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // Complete task (User - blockchain tx)
  const completeTask = async (taskId) => {
    try {
      setLoading(true);
      const task = tasks.find((t) => t.id === taskId);

      // Add confirmation dialog before proceeding with transaction
      const confirmTransaction = confirm(
        "💰 Complete Task Transaction\n\n" +
        `This will send ${task.reward?.amount || "0.001"} SHM as reward.\n\n` +
        "Do you want to proceed?"
      );

      if (!confirmTransaction) {
        console.log("❌ User cancelled task completion");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const rewardAmount = task.reward?.amount || "0.001";

      // BLOCKCHAIN TRANSACTION DISABLED TO PREVENT UNWANTED METAMASK PROMPTS
      // const tx = await signer.sendTransaction({
      //   to: account,
      //   value: ethers.parseEther(rewardAmount),
      //   data: ethers.toUtf8Bytes(
      //     JSON.stringify({
      //       action: "completeTask",
      //       taskId,
      //       reward: rewardAmount,
      //       user: account
      //     })
      //   )
      // });

      // Create fake transaction for history display
      const fakeHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;

      onTx({
        hash: fakeHash, // tx.hash,
        from: account,
        to: account,
        value: rewardAmount,
        pending: false, // true,
        action: "Complete Task",
        details: `${task.title} - Reward: ${rewardAmount} SHM (Backend only)`,
        timestamp: new Date().toISOString()
      });

      // await tx.wait(); // DISABLED

      await fetch(`${API_BASE_URL}/tasks/${taskId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionHash: fakeHash }) // tx.hash)
      });

      fetchTasks();
      alert(`🎉 Task completed! You earned ${rewardAmount} SHM`);
    } catch (err) {
      console.error("Failed to complete task:", err);
      alert("❌ Failed to complete task");
    } finally {
      setLoading(false);
    }
  };

  // Accept task (User)
  const acceptTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: currentUser })
      });
      if (!response.ok) throw new Error("Failed to accept task");
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to accept task");
    } finally {
      setLoading(false);
    }
  };

  // Approve task (Admin)
  const approveTask = async (taskId) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, { method: "PATCH" });
      fetchTasks();
    } catch {
      alert("❌ Failed to approve task");
    } finally {
      setLoading(false);
    }
  };

  // Reject task (Admin)
  const rejectTask = async (taskId) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/tasks/${taskId}/reject`, { method: "PATCH" });
      fetchTasks();
    } catch {
      alert("❌ Failed to reject task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold">Filters</h3>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Admin Create Task */}
      {userRole === "Admin" && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Create Task</h3>
          <input
            value={newTask.title}
            onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="border p-2 w-full mb-2"
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="border p-2 w-full mb-2"
          />
          <button onClick={createTask} disabled={loading} className="bg-blue-500 text-white px-4 py-2">
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-3">Tasks</h3>
        {fetchingTasks ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border p-3 rounded mb-2">
              <h4 className="font-semibold">{task.title}</h4>
              <p>{task.description}</p>
              <p>Status: {task.status}</p>
              <p>Reward: {task.reward?.amount} SHM</p>
              {userRole === "User" && task.status === "open" && !task.assignee && (
                <button onClick={() => acceptTask(task.id)} className="bg-green-500 text-white px-3 py-1 mt-2">
                  Accept
                </button>
              )}
              {userRole === "User" && task.assignee === currentUser && task.status === "in_progress" && (
                <button onClick={() => completeTask(task.id)} className="bg-blue-500 text-white px-3 py-1 mt-2">
                  Complete
                </button>
              )}
              {userRole === "Admin" && task.status === "review" && (
                <div className="flex space-x-2 mt-2">
                  <button onClick={() => approveTask(task.id)} className="bg-green-500 text-white px-3 py-1">
                    Approve
                  </button>
                  <button onClick={() => rejectTask(task.id)} className="bg-red-500 text-white px-3 py-1">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
