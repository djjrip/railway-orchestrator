'use client';

import { useState, useEffect } from 'react';

export type CloudProvider = 'railway' | 'fly' | 'render';

export interface ContainerInstance {
  id: string;
  name: string;
  provider: CloudProvider;
  status: 'ONLINE' | 'PROVISIONING' | 'OFFLINE';
  createdAt: string;
  region: string;
  url?: string;
}

export default function Home() {
  const [containers, setContainers] = useState<ContainerInstance[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'all' | CloudProvider>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<ContainerInstance | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchContainers = async (provider = selectedProvider) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orchestrator?provider=${provider}`);
      const data = await res.json();
      if (res.ok) {
        setContainers(data.containers || data.services || []);
        setIsDemo(!!data.isDemo);
      } else {
        setError(data.error || 'Failed to fetch containers');
      }
    } catch {
      setError('Network error connecting to multi-cloud orchestrator API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers(selectedProvider);
  }, [selectedProvider]);

  const handleSpinUp = async (targetProvider?: CloudProvider) => {
    const providerToUse = targetProvider || (selectedProvider === 'all' ? 'railway' : selectedProvider);
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerToUse,
          name: `${providerToUse}-node-${Math.floor(Math.random() * 900 + 100)}`,
          image: 'nginx:alpine',
          region: providerToUse === 'fly' ? 'ord' : providerToUse === 'render' ? 'ohio' : 'us-west1'
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchContainers(selectedProvider);
      } else {
        setError(data.error || 'Failed to spin up container');
      }
    } catch {
      setError('Network error during spin up');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpinDown = async (container: ContainerInstance) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orchestrator?id=${container.id}&provider=${container.provider}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        if (selectedContainer?.id === container.id) {
          setSelectedContainer(null);
          setLogs([]);
        }
        await fetchContainers(selectedProvider);
      } else {
        setError(data.error || 'Failed to spin down container');
      }
    } catch {
      setError('Network error during spin down');
    } finally {
      setActionLoading(false);
    }
  };

  const openLogs = async (container: ContainerInstance) => {
    setSelectedContainer(container);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/orchestrator/logs?id=${container.id}&provider=${container.provider}`);
      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs.map((l: { timestamp: string; message: string }) => `[${l.timestamp}] ${l.message}`));
      } else {
        setLogs(['[system] Connected to container telemetry stream.']);
      }
    } catch {
      setLogs(['[error] Failed to stream multi-cloud logs.']);
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
                <span className="text-purple-400">⚡</span> Railway Orchestrator & Multi-Cloud Fleet
              </h1>
              {isDemo && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                  Universal Sandbox
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Cross-platform container provisioning & telemetry across Railway (GraphQL v2), Fly.io (Machines API), and Render (REST API)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSpinUp()}
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

        {/* Cloud Provider Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-800/80 pb-4">
          <span className="text-xs font-semibold uppercase text-gray-400 mr-2">Control Plane:</span>
          {[
            { id: 'all', label: '🌐 All Clouds (Fleet View)', badge: containers.length },
            { id: 'railway', label: '🟣 Railway (GraphQL v2)', badge: containers.filter(c => c.provider === 'railway').length },
            { id: 'fly', label: '🎈 Fly.io (Machines API)', badge: containers.filter(c => c.provider === 'fly').length },
            { id: 'render', label: '🟢 Render (REST API)', badge: containers.filter(c => c.provider === 'render').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedProvider(tab.id as 'all' | CloudProvider)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                selectedProvider === tab.id
                  ? 'bg-purple-900/60 text-purple-100 border border-purple-700 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Status / Notice Banner */}
        {isDemo && (
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-lg p-4 text-xs md:text-sm text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>
                <strong>Multi-Cloud Sandbox Active:</strong> Dispatched across Railway, Fly.io, and Render mock runtimes. To bind live clusters, define <code className="bg-purple-900/60 px-1 py-0.5 rounded font-mono">RAILWAY_API_TOKEN</code>, <code className="bg-purple-900/60 px-1 py-0.5 rounded font-mono">FLY_API_TOKEN</code>, or <code className="bg-purple-900/60 px-1 py-0.5 rounded font-mono">RENDER_API_KEY</code>.
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
            <span className="text-xs text-gray-400 font-mono">{containers.length} instances across active fleet</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Querying multi-cloud telemetry plane...</div>
          ) : containers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No active containers detected for this filter. Click <strong className="text-purple-400">Spin Up Container</strong> above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800 text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-[#13171e]">
                    <th className="px-6 py-3.5 text-left font-medium">Provider</th>
                    <th className="px-6 py-3.5 text-left font-medium">Status</th>
                    <th className="px-6 py-3.5 text-left font-medium">Service Name</th>
                    <th className="px-6 py-3.5 text-left font-medium">Region</th>
                    <th className="px-6 py-3.5 text-left font-medium">Provisioned</th>
                    <th className="px-6 py-3.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {containers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          c.provider === 'railway'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                            : c.provider === 'fly'
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {c.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                        {c.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-3 text-xs">
                        <button
                          onClick={() => openLogs(c)}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-700 font-medium transition-colors"
                        >
                          View Logs
                        </button>
                        <button
                          onClick={() => handleSpinDown(c)}
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
        {selectedContainer && (
          <div className="bg-[#0b0e14] rounded-xl border border-gray-800 shadow-2xl overflow-hidden font-mono text-xs">
            <div className="bg-[#161b22] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="text-gray-300 font-semibold ml-2">
                  Live Telemetry [{selectedContainer.provider.toUpperCase()}] — {selectedContainer.name} ({selectedContainer.id.slice(0, 10)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openLogs(selectedContainer)}
                  className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setSelectedContainer(null)}
                  className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto space-y-1 bg-black/60 text-gray-300 select-text">
              {logsLoading ? (
                <div className="text-gray-500 py-4 text-center">Attaching to {selectedContainer.provider} telemetry pipe...</div>
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
