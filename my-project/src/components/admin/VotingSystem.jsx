import React, { useState } from "react";
import { ethers } from "ethers";

export default function VotingSystem({ userRole, account, onTx }) {
  const [polls, setPolls] = useState([
    {
      id: 1,
      title: "Choose Next Platform Feature",
      description: "Vote for the next feature to be implemented in our platform",
      options: [
        { id: 1, text: "NFT Marketplace", votes: 15 },
        { id: 2, text: "DeFi Integration", votes: 8 },
        { id: 3, text: "Social Features", votes: 12 },
        { id: 4, text: "Mobile App", votes: 20 },
      ],
      createdBy: "0x123...abc",
      endDate: "2024-01-25",
      status: "active",
      hasVoted: false,
    },
    {
      id: 2,
      title: "Community Governance Proposal",
      description: "Should we implement a decentralized governance token?",
      options: [
        { id: 1, text: "Yes, implement governance token", votes: 25 },
        { id: 2, text: "No, keep current system", votes: 10 },
        { id: 3, text: "Need more discussion", votes: 5 },
      ],
      createdBy: "0x456...def",
      endDate: "2024-01-20",
      status: "ended",
      hasVoted: true,
    },
  ]);

  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    options: ["", ""],
    endDate: "",
  });

  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const createPoll = async () => {
    if (!newPoll.title || !newPoll.description || !newPoll.endDate || 
        newPoll.options.some(opt => !opt.trim())) {
      alert("Please fill in all fields and options");
      return;
    }

    try {
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Simulate blockchain transaction for poll creation
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther("0.001"),
        data: ethers.toUtf8Bytes(JSON.stringify({
          action: "createPoll",
          title: newPoll.title,
          optionsCount: newPoll.options.length
        }))
      });

      // Add transaction to history
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: true,
        action: "Create Poll",
        details: newPoll.title,
        timestamp: new Date().toISOString(),
      });

      // Add poll to local state
      const poll = {
        id: Date.now(),
        ...newPoll,
        options: newPoll.options.map((text, index) => ({
          id: index + 1,
          text,
          votes: 0
        })),
        createdBy: account,
        status: "active",
        hasVoted: false,
      };

      setPolls(prev => [poll, ...prev]);
      setNewPoll({ title: "", description: "", options: ["", ""], endDate: "" });

      await tx.wait();
      
      // Update transaction as confirmed
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: false,
        action: "Create Poll",
        details: newPoll.title,
        timestamp: new Date().toISOString(),
      });

      alert("✅ Poll created successfully on blockchain!");
    } catch (err) {
      console.error("Failed to create poll:", err);
      alert("❌ Failed to create poll: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (pollId, optionId) => {
    try {
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const poll = polls.find(p => p.id === pollId);
      const option = poll.options.find(o => o.id === optionId);
      
      // Simulate blockchain transaction for voting
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther("0.001"),
        data: ethers.toUtf8Bytes(JSON.stringify({
          action: "vote",
          pollId: pollId,
          optionId: optionId
        }))
      });

      // Add transaction to history
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: true,
        action: "Cast Vote",
        details: `${poll.title} - ${option.text}`,
        timestamp: new Date().toISOString(),
      });

      // Update poll with new vote
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            hasVoted: true,
            options: p.options.map(o => 
              o.id === optionId ? { ...o, votes: o.votes + 1 } : o
            )
          };
        }
        return p;
      }));

      await tx.wait();
      
      // Update transaction as confirmed
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: false,
        action: "Cast Vote",
        details: `${poll.title} - ${option.text}`,
        timestamp: new Date().toISOString(),
      });

      alert("🗳️ Vote cast successfully!");
    } catch (err) {
      console.error("Failed to vote:", err);
      alert("❌ Failed to vote: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin: Create Poll */}
      {userRole === "Admin" && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">👑</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Create New Poll</h3>
              <p className="text-sm text-gray-600">Admin Panel - Create polls for community voting</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poll Title</label>
              <input
                type="text"
                value={newPoll.title}
                onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter poll title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newPoll.description}
                onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this poll is about"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={newPoll.endDate}
                onChange={(e) => setNewPoll(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 py-3 px-4 rounded-lg transition-all"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300"
                >
                  ➕ Add Option
                </button>
              </div>
            </div>

            <button
              onClick={createPoll}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Poll...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🗳️</span>
                  <span>Create Poll on Blockchain</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Poll List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🗳️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Active Polls</h3>
              <p className="text-sm text-gray-600">
                {userRole === "Admin" ? "Manage community polls" : "Participate in community voting"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Polls</p>
            <p className="text-2xl font-bold text-purple-600">{polls.length}</p>
          </div>
        </div>

        <div className="space-y-6">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            
            return (
              <div key={poll.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900 text-lg">{poll.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        poll.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {poll.status === "active" ? "🔴 Live" : "⏹️ Ended"}
                      </span>
                      {poll.hasVoted && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          ✅ Voted
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{poll.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>👤</span>
                        <span>Created by: {poll.createdBy.slice(0, 6)}...{poll.createdBy.slice(-4)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>Ends: {poll.endDate}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🗳️</span>
                        <span>Total votes: {totalVotes}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {poll.options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{option.text}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{option.votes} votes</span>
                            <span className="text-sm font-medium text-gray-900">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          
                          {poll.status === "active" && !poll.hasVoted && userRole === "User" && (
                            <button
                              onClick={() => vote(poll.id, option.id)}
                              disabled={loading}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {loading ? "Voting..." : "Vote"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {poll.status === "active" && poll.hasVoted && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <span>ℹ️</span>
                      <span className="text-sm font-medium">You have already voted in this poll</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {polls.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗳️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Polls Available</h3>
              <p className="text-gray-600">
                {userRole === "Admin" 
                  ? "Create your first poll to get the community involved" 
                  : "Check back later for community polls"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}