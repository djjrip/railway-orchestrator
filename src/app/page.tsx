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
  const [isDemo, setIsDemo] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/railway');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
        setIsDemo(!!data.isDemo);
      } else {
        setError(data.error || 'Failed to fetch services');
      }
    } catch {
      setError('Network error connecting to API');
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
      const res = await fetch('/api/railway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `web-node-${Math.floor(Math.random() * 900 + 100)}`, image: 'nginx:alpine' }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
      } else {
        setError(data.error || 'Failed to spin up container');
      }
    } catch {
      setError('Network error during spin up');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpinDown = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/railway?id=' + id, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        if (selectedService?.id === id) {
          setSelectedService(null);
          setLogs([]);
        }
        await fetchServices();
      } else {
        setError(data.error || 'Failed to spin down container');
      }
    } catch {
      setError('Network error during spin down');
    } finally {
      setActionLoading(false);
    }
  };

  const openLogs = async (service: Service) => {
    setSelectedService(service);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/railway/logs?id=${service.id}&name=${encodeURIComponent(service.name)}`);
      const data = await res.json();
      setLogs(data.logs || ['[system] No log stream found for this container.']);
    } catch {
      setLogs(['[error] Failed to stream logs from container runtime.']);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] p-6 md:p-12 font-sans text-gray-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-purple-400">⚡</span> Railway Orchestrator
              </h1>
              {isDemo && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                  Demo Sandbox
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Production container provisioning and live runtime telemetry via Railway GraphQL API v2
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSpinUp}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Spinning Up...
                </>
              ) : (
                <>
                  <span>+</span> Spin Up Container
                </>
              )}
            </button>
          </div>
        </header>

        {/* Status / Notice Banner */}
        {isDemo && (
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-lg p-4 text-xs md:text-sm text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>
                <strong>Sandbox Active:</strong> Simulated containers connected. To bind live Railway infra, define <code className="bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-100 font-mono">RAILWAY_API_TOKEN</code> in <code className="font-mono">.env.local</code>.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 text-red-300 p-4 rounded-lg border border-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Container Services Table */}
        <div className="bg-[#161b22] rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Active Containers</h2>
            <span className="text-xs text-gray-400 font-mono">{services.length} instances online</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Querying Railway cluster...</div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No active containers detected. Click <strong className="text-purple-400">Spin Up Container</strong> above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800 text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-[#13171e]">
                    <th className="px-6 py-3.5 text-left font-medium">Status</th>
                    <th className="px-6 py-3.5 text-left font-medium">Service Name</th>
                    <th className="px-6 py-3.5 text-left font-medium">Container ID</th>
                    <th className="px-6 py-3.5 text-left font-medium">Provisioned</th>
                    <th className="px-6 py-3.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                        {service.id.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(service.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-3 text-xs">
                        <button
                          onClick={() => openLogs(service)}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-700 font-medium transition-colors"
                        >
                          View Logs
                        </button>
                        <button
                          onClick={() => handleSpinDown(service.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded border border-red-800/60 font-medium transition-colors disabled:opacity-50"
                        >
                          Spin Down
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Container Log Monitor Console */}
        {selectedService && (
          <div className="bg-[#0b0e14] rounded-xl border border-gray-800 shadow-2xl overflow-hidden font-mono text-xs">
            <div className="bg-[#161b22] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="text-gray-300 font-semibold ml-2">
                  Live Logs — {selectedService.name} ({selectedService.id.slice(0, 8)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openLogs(selectedService)}
                  className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto space-y-1 bg-black/60 text-gray-300 select-text">
              {logsLoading ? (
                <div className="text-gray-500 py-4 text-center">Attaching to container stdout/stderr pipe...</div>
              ) : (
                logs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-gray-500 select-none mr-2">{idx + 1}</span>
                    <span className={line.includes('200 OK') ? 'text-emerald-400' : line.includes('error') ? 'text-red-400' : 'text-gray-300'}>
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
