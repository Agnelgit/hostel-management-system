import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Complaint } from '../../types';

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await apiClient.getComplaints();
        setComplaints(data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (loading) return <div className="p-6">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Complaints</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {complaints.length === 0 ? (
          <div className="text-gray-500">No complaints found.</div>
        ) : (
          <div className="space-y-4">
            {complaints.map(c => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-gray-600">{c.description}</div>
                    <div className="text-xs text-gray-500 mt-2">By: {c.student_name} ({c.student_id_number})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{c.status}</div>
                    <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaints;
