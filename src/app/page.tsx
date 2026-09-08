'use client';

import { useState, useEffect } from 'react';

type Service = {
  id: string;
  name: string;
  createdAt: string;
};

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
      } else {
        setError(data.error || 'Failed to fetch services');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSpinUp = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'nginx-container', image: 'nginx:alpine' }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
      } else {
        setError(data.error || 'Failed to spin up');
      }
    } catch (err) {
      setError('Network error during spin up');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpinDown = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(/api/services?id=, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
      } else {
        setError(data.error || 'Failed to spin down');
      }
    } catch (err) {
      setError('Network error during spin down');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Railway Orchestrator</h1>
            <p className="text-gray-500 mt-2">Manage container services via GraphQL</p>
          </div>
          <button
            onClick={handleSpinUp}
            disabled={actionLoading}
            className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Spinning Up...' : 'Spin Up Container'}
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active containers. Spin one up!</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {service.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSpinDown(service.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Spin Down
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
