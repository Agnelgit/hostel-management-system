import React, { useState, useEffect } from 'react';
import { Building, Users, DollarSign, MapPin } from 'lucide-react';
import { Room, Student } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/client';
import RoomAllocation from './RoomAllocation';

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocation, setShowAllocation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, studentsData] = await Promise.all([
        apiClient.getRooms(),
        apiClient.getStudents()
      ]);
      setRooms(roomsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'single':
        return 'bg-purple-100 text-purple-800';
      case 'double':
        return 'bg-blue-100 text-blue-800';
      case 'triple':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
        {(user?.role === 'admin' || user?.role === 'warden') && (
          <button
            onClick={() => setShowAllocation(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Allocate Room
          </button>
        )}
      </div>

      {/* Room Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {rooms.filter(r => r.status === 'available').length}
              </p>
            </div>
            <Building className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-blue-600">
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
            </div>
            <Building className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Room {room.room_number}
                </h3>
                <p className="text-sm text-gray-600">Floor {room.floor}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(room.room_type)}`}>
                  {room.room_type}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Capacity:</span>
                <span className="text-sm font-medium text-gray-900">
                  {room.current_occupancy || 0}/{room.capacity}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Monthly Fee:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{room.monthly_fee.toLocaleString()}
                </span>
              </div>

              {room.occupants && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Occupants:</p>
                  <p className="text-sm text-gray-900">{room.occupants}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((room.current_occupancy / room.capacity) * 100)}% occupied
              </p>
            </div>
          </div>
        ))}
      </div>

      {showAllocation && (
        <RoomAllocation
          rooms={rooms.filter(r => r.status === 'available' || r.current_occupancy < r.capacity)}
          students={students.filter(s => !s.room_number && s.status === 'active')}
          onClose={() => setShowAllocation(false)}
          onSave={() => {
            fetchData();
            setShowAllocation(false);
          }}
        />
      )}
    </div>
  );
};

export default RoomManagement;