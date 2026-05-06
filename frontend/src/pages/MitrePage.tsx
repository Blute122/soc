import { useEffect, useMemo, useState } from 'react';
import { getAlerts, getMitreTactics, getMitreTechniques } from '../services/api';

export default function MitrePage() {
  const [tactics, setTactics] = useState<any[]>([]);
  const [techniques, setTechniques] = useState<any[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<any>(null);
  const [view, setView] = useState<'matrix' | 'library'>('matrix');
  const [detectedTechniques, setDetectedTechniques] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMitreTactics().then((r) => setTactics(r.data)).catch(() => {});
    getMitreTechniques().then((r) => setTechniques(r.data)).catch(() => {});
    getAlerts({ limit: 500 }).then((r) => {
      const detected = new Set<string>();
      r.data.forEach((alert: any) => {
        if (alert.mitre_technique) detected.add(String(alert.mitre_technique).split('.')[0]);
      });
      setDetectedTechniques(detected);
    }).catch(() => {});
  }, []);

  const filtered = selectedTactic
    ? techniques.filter((t) => t.tactic === selectedTactic)
    : techniques;

  const tacticColors: Record<string, string> = {
    TA0001: 'from-blue-600 to-blue-400',
    TA0002: 'from-red-600 to-red-400',
    TA0003: 'from-purple-600 to-purple-400',
    TA0004: 'from-orange-600 to-orange-400',
    TA0005: 'from-yellow-600 to-yellow-400',
    TA0006: 'from-pink-600 to-pink-400',
    TA0007: 'from-cyan-600 to-cyan-400',
    TA0008: 'from-green-600 to-green-400',
    TA0009: 'from-indigo-600 to-indigo-400',
    TA0010: 'from-rose-600 to-rose-400',
    TA0011: 'from-emerald-600 to-emerald-400',
    TA0040: 'from-red-700 to-red-500',
    TA0042: 'from-teal-600 to-teal-400',
    TA0043: 'from-sky-600 to-sky-400',
  };

  const sevColors: Record<string, string> = {
    critical: 'severity-critical',
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low',
  };

  const matrixColumns = useMemo(() => tactics.map((tactic) => ({
    tactic,
    techniques: techniques.filter((tech) => tech.tactic === tactic.id),
  })), [tactics, techniques]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MITRE ATT&CK Framework</h1>
          <p className="text-sm text-[var(--text-muted)] font-mono">
            ATT&CK matrix with detected techniques highlighted from active alert telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('matrix')}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${view === 'matrix' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-cyan-500/10' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}
          >
            Matrix
          </button>
          <button
            onClick={() => setView('library')}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${view === 'library' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-cyan-500/10' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}
          >
            Library
          </button>
        </div>
      </div>

      {view === 'matrix' && (
        <div className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <div className="grid gap-3 min-w-[1300px]" style={{ gridTemplateColumns: `repeat(${matrixColumns.length || 1}, minmax(150px, 1fr))` }}>
              {matrixColumns.map(({ tactic, techniques: tacticTechniques }) => (
                <div key={tactic.id} className="space-y-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${tacticColors[tactic.id] || 'from-slate-700 to-slate-600'} text-white min-h-[58px]`}>
                    <p className="text-[10px] font-mono opacity-80">{tactic.id}</p>
                    <p className="text-xs font-bold leading-tight">{tactic.name}</p>
                  </div>
                  <div className="space-y-2">
                    {tacticTechniques.map((tech: any) => {
                      const detected = detectedTechniques.has(tech.id);
                      return (
                        <button
                          key={tech.id}
                          onClick={() => setSelectedTechnique(tech)}
                          className={`w-full text-left p-2 rounded border transition-all ${
                            detected
                              ? 'border-red-500/50 bg-red-500/15 shadow-[0_0_18px_rgba(239,68,68,0.18)]'
                              : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-cyan)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-[var(--accent-cyan)]">{tech.id}</span>
                            {detected && <span className="text-[9px] font-mono text-red-400">DETECTED</span>}
                          </div>
                          <p className="text-[11px] text-[var(--text-primary)] leading-snug mt-1">{tech.name}</p>
                        </button>
                      );
                    })}
                    {tacticTechniques.length === 0 && (
                      <div className="p-3 rounded border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-mono">No mapped techniques</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTechnique && (
            <TechniqueDetail technique={selectedTechnique} onClose={() => setSelectedTechnique(null)} />
          )}
        </div>
      )}

      {view === 'library' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTactic(null)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                !selectedTactic ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-cyan-500/10' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
              }`}
            >
              All Tactics
            </button>
            {tactics.map((tactic: any) => (
              <button
                key={tactic.id}
                onClick={() => setSelectedTactic(tactic.id)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                  selectedTactic === tactic.id ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-cyan-500/10' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {tactic.name}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-2 content-start">
              {filtered.map((tech: any) => (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechnique(tech)}
                  className={`glass-card p-4 cursor-pointer ${selectedTechnique?.id === tech.id ? 'border-[var(--accent-cyan)]' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-[var(--accent-cyan)]">{tech.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColors[tech.severity] || ''}`}>
                      {tech.severity?.toUpperCase()}
                    </span>
                    {detectedTechniques.has(tech.id) && <span className="text-[10px] font-mono text-red-400">DETECTED</span>}
                  </div>
                  <h4 className="text-sm font-semibold mb-1">{tech.name}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{tech.description}</p>
                  <div className="mt-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-gradient-to-r ${tacticColors[tech.tactic] || 'from-gray-600 to-gray-400'} text-white`}>
                      {tech.tactic_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedTechnique && (
              <div className="w-[380px]">
                <TechniqueDetail technique={selectedTechnique} onClose={() => setSelectedTechnique(null)} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TechniqueDetail({ technique, onClose }: { technique: any; onClose: () => void }) {
  return (
    <div className="glass-card p-5 self-start animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-mono font-bold text-[var(--accent-cyan)]">{technique.id}</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-sm">Close</button>
      </div>
      <h3 className="text-lg font-bold mb-2">{technique.name}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{technique.description}</p>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
          <label className="text-xs text-[var(--text-muted)] font-mono">TACTIC</label>
          <p className="text-sm font-medium">{technique.tactic_name}</p>
        </div>
        {technique.sub_techniques && Object.keys(technique.sub_techniques).length > 0 && (
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono mb-2 block">SUB-TECHNIQUES</label>
            <div className="space-y-1">
              {Object.entries(technique.sub_techniques).map(([id, name]) => (
                <div key={id} className="flex items-center gap-2 p-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
                  <span className="text-xs font-mono text-[var(--accent-cyan)]">{id}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{name as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <label className="text-xs text-cyan-400 font-mono">RECOMMENDED ACTION</label>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{technique.recommended_action}</p>
        </div>
      </div>
    </div>
  );
}
