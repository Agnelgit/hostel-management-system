import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { FeeRecord } from '../../types';

const AdminFees: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await apiClient.getFees();
        setFees(data);
      } catch (error) {
        console.error('Error fetching fees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  if (loading) return <div className="p-6">Loading fees...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fee Records</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {fees.length === 0 ? (
          <div className="text-gray-500">No fee records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Due</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id} className="border-t">
                    <td className="px-4 py-2">{f.student_name} ({f.student_id_number})</td>
                    <td className="px-4 py-2">{f.fee_type}</td>
                    <td className="px-4 py-2">₹{f.amount}</td>
                    <td className="px-4 py-2">{f.status}</td>
                    <td className="px-4 py-2">{new Date(f.due_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFees;
