// Test script to verify completed task processing
console.log("🧪 Testing completed task processing...");

// Sample data from backend (what we saw in the curl response)
const sampleData = {
  "success": true,
  "transactions": [
    {
      "id": 10,
      "task_id": 10,
      "title": "harsh calling",
      "assignee": "0xaA16Eb82Cd4C39473101846c2975eAd10954cc50",
      "creator": "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4",
      "status": "completed",
      "reward_amount": 0.0001,
      "reward_token": "SHM",
      "blockchain_proof": "task_10_1758395331",
      "created_at": "2025-09-20 20:00:16",
      "usd_value": "$0.00",
      "transaction_type": "task_completed",
      "description": "Task completed and reward distributed"
    },
    {
      "id": 8,
      "task_id": 8,
      "title": "hi hello",
      "assignee": "0xaA16Eb82Cd4C39473101846c2975eAd10954cc50",
      "creator": "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4",
      "status": "completed",
      "reward_amount": 0.0001,
      "reward_token": "SHM",
      "blockchain_proof": "task_8_1758395331",
      "created_at": "2025-09-20 19:31:30",
      "usd_value": "$0.00",
      "transaction_type": "task_completed",
      "description": "Task completed and reward distributed"
    },
    {
      "id": 11,
      "task_id": 11,
      "title": "Harsh Calling",
      "assignee": "0xaA16Eb82Cd4C39473101846c2975eAd10954cc50",
      "creator": "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4",
      "status": "in_progress",
      "reward_amount": 0.0001,
      "reward_token": "SHM",
      "blockchain_proof": "task_11_1758395331",
      "created_at": "2025-09-20 20:18:34",
      "usd_value": "$0.00",
      "transaction_type": "task_accepted",
      "description": "Task accepted and in progress"
    }
  ]
};

console.log(`📊 Total transactions: ${sampleData.transactions.length}`);

// Filter completed tasks (like our component does)
const completedTasks = sampleData.transactions.filter(tx => tx.status === 'completed');
console.log(`🎯 Completed tasks found: ${completedTasks.length}`);

completedTasks.forEach((task, index) => {
  console.log(`🏆 Completed Task ${index + 1}:`);
  console.log(`   Title: "${task.title}"`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Transaction Type: ${task.transaction_type}`);
  console.log(`   Task ID: ${task.task_id}`);
  console.log(`   Created: ${task.created_at}`);
  console.log(`   ---`);
});

// Process transactions like our component does
const processedTransactions = sampleData.transactions.map(tx => ({
  id: `transaction_${tx.id}`,
  hash: tx.blockchain_proof || `task_${tx.id}_${Date.now()}`,
  type: tx.transaction_type || "Task Transaction",
  amount: parseFloat(tx.reward_amount || 0.0001),
  usd: tx.usd_value || "$0.00",
  status: tx.status || "pending",
  timestamp: new Date(tx.created_at || Date.now()),
  createdAt: new Date(tx.created_at || Date.now()),
  from: tx.creator || "System",
  to: tx.assignee || "account",
  taskId: tx.task_id || tx.id,
  action: tx.title || tx.description || "Task Transaction",
  source: "transition.php",
  isCompleted: tx.status === 'completed',
  transactionType: tx.transaction_type,
  description: tx.description
}));

console.log(`✅ Processed ${processedTransactions.length} transactions`);

const processedCompleted = processedTransactions.filter(tx => tx.isCompleted);
console.log(`🎯 Processed completed transactions: ${processedCompleted.length}`);

processedCompleted.forEach((tx, index) => {
  console.log(`🏆 Processed Completed ${index + 1}: "${tx.action}" (${tx.status})`);
});

console.log("✅ Test completed! The data processing should work correctly.");