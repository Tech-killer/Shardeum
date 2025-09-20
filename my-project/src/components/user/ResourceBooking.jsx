import React, { useState } from "react";
import { ethers } from "ethers";

export default function ResourceBooking({ userRole, account, onTx }) {
  const [resources, setResources] = useState([
    {
      id: 1,
      name: "Conference Room A",
      description: "Large conference room with projector and whiteboard",
      capacity: 12,
      hourlyRate: "0.05",
      image: "🏢",
      available: true,
    },
    {
      id: 2,
      name: "Development Lab",
      description: "Equipped with latest development tools and high-performance computers",
      capacity: 8,
      hourlyRate: "0.08",
      image: "💻",
      available: true,
    },
    {
      id: 3,
      name: "Recording Studio",
      description: "Professional recording studio with sound equipment",
      capacity: 4,
      hourlyRate: "0.12",
      image: "🎵",
      available: false,
    },
    {
      id: 4,
      name: "Training Room B",
      description: "Medium-sized training room with interactive display",
      capacity: 20,
      hourlyRate: "0.06",
      image: "📚",
      available: true,
    },
  ]);

  const [bookings, setBookings] = useState([
    {
      id: 1,
      resourceId: 3,
      resourceName: "Recording Studio",
      bookedBy: "0x456...def",
      date: "2024-01-18",
      startTime: "14:00",
      duration: 2,
      totalCost: "0.24",
      status: "confirmed",
    },
    {
      id: 2,
      resourceId: 1,
      resourceName: "Conference Room A",
      bookedBy: account,
      date: "2024-01-19",
      startTime: "10:00",
      duration: 3,
      totalCost: "0.15",
      status: "confirmed",
    },
  ]);

  const [selectedResource, setSelectedResource] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    startTime: "",
    duration: 1,
  });
  const [loading, setLoading] = useState(false);

  const openBookingModal = (resource) => {
    setSelectedResource(resource);
    setBookingForm({
      date: "",
      startTime: "",
      duration: 1,
    });
  };

  const closeBookingModal = () => {
    setSelectedResource(null);
  };

  const bookResource = async () => {
    if (!bookingForm.date || !bookingForm.startTime || bookingForm.duration < 1) {
      alert("Please fill in all booking details");
      return;
    }

    try {
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const totalCost = (parseFloat(selectedResource.hourlyRate) * bookingForm.duration).toString();
      
      // Simulate blockchain transaction for resource booking
      const tx = await signer.sendTransaction({
        to: "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4", // Platform wallet
        value: ethers.parseEther(totalCost),
        data: ethers.toUtf8Bytes(JSON.stringify({
          action: "bookResource",
          resourceId: selectedResource.id,
          date: bookingForm.date,
          startTime: bookingForm.startTime,
          duration: bookingForm.duration
        }))
      });

      // Add transaction to history
      onTx({
        hash: tx.hash,
        from: account,
        to: "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4",
        value: totalCost,
        pending: true,
        action: "Book Resource",
        details: `${selectedResource.name} - ${bookingForm.date}`,
        timestamp: new Date().toISOString(),
      });

      // Add booking to local state
      const booking = {
        id: Date.now(),
        resourceId: selectedResource.id,
        resourceName: selectedResource.name,
        bookedBy: account,
        date: bookingForm.date,
        startTime: bookingForm.startTime,
        duration: bookingForm.duration,
        totalCost: totalCost,
        status: "confirmed",
      };

      setBookings(prev => [booking, ...prev]);
      closeBookingModal();

      await tx.wait();
      
      // Update transaction as confirmed
      onTx({
        hash: tx.hash,
        from: account,
        to: "0xa15eCBf6E059F2F09CA8400217429833Bc3B56C4",
        value: totalCost,
        pending: false,
        action: "Book Resource",
        details: `${selectedResource.name} - ${bookingForm.date}`,
        timestamp: new Date().toISOString(),
      });

      alert("✅ Resource booked successfully!");
    } catch (err) {
      console.error("Failed to book resource:", err);
      alert("❌ Failed to book resource: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const booking = bookings.find(b => b.id === bookingId);
      
      // Simulate blockchain transaction for booking cancellation
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther("0.001"),
        data: ethers.toUtf8Bytes(JSON.stringify({
          action: "cancelBooking",
          bookingId: bookingId
        }))
      });

      // Add transaction to history
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: true,
        action: "Cancel Booking",
        details: `${booking.resourceName} - ${booking.date}`,
        timestamp: new Date().toISOString(),
      });

      // Update booking status
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      ));

      await tx.wait();
      
      // Update transaction as confirmed
      onTx({
        hash: tx.hash,
        from: account,
        to: account,
        value: "0.001",
        pending: false,
        action: "Cancel Booking",
        details: `${booking.resourceName} - ${booking.date}`,
        timestamp: new Date().toISOString(),
      });

      alert("🚫 Booking cancelled successfully!");
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert("❌ Failed to cancel booking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    if (!selectedResource) return "0";
    return (parseFloat(selectedResource.hourlyRate) * bookingForm.duration).toFixed(3);
  };

  return (
    <div className="space-y-6">
      {/* Available Resources */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Available Resources</h3>
              <p className="text-sm text-gray-600">Book shared resources for your needs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Resources</p>
            <p className="text-2xl font-bold text-yellow-600">{resources.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{resource.image}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                    <p className="text-sm text-gray-600">Capacity: {resource.capacity} people</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  resource.available 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {resource.available ? "✅ Available" : "🚫 Booked"}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{resource.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-yellow-600">
                  {resource.hourlyRate} SHM/hour
                </div>
                <button
                  onClick={() => openBookingModal(resource)}
                  disabled={!resource.available || loading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {resource.available ? "📅 Book Now" : "🚫 Unavailable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Bookings */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">My Bookings</h3>
              <p className="text-sm text-gray-600">Manage your resource bookings</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Active Bookings</p>
            <p className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.bookedBy === account && b.status === "confirmed").length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {bookings
            .filter(booking => booking.bookedBy === account)
            .map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{booking.resourceName}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === "confirmed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {booking.status === "confirmed" ? "✅ Confirmed" : "🚫 Cancelled"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>⏰</span>
                        <span>{booking.startTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>{booking.duration}h</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>💰</span>
                        <span>{booking.totalCost} SHM</span>
                      </div>
                    </div>
                  </div>

                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      disabled={loading}
                      className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            ))}

          {bookings.filter(booking => booking.bookedBy === account).length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600">Book a resource to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Book {selectedResource.name}</h3>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{selectedResource.image}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedResource.name}</h4>
                    <p className="text-sm text-gray-600">{selectedResource.hourlyRate} SHM/hour</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{selectedResource.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800">Total Cost:</span>
                  <span className="text-xl font-bold text-yellow-700">{getTotalCost()} SHM</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeBookingModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={bookResource}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Booking...</span>
                    </div>
                  ) : (
                    "📅 Book Now"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}