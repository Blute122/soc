import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  addIncidentEvidence,
  addIncidentNote,
  createIncident,
  getIncidentDetail,
  getIncidents,
  getUsers,
  updateIncidentStatus,
} from '../services/api';

const statuses = ['open', 'investigating', 'contained', 'resolved', 'closed'];

const statusColors: Record<string, string> = {
  open: 'status-new',
  investigating: 'status-investigating',
  contained: 'status-contained',
  resolved: 'status-resolved',
  closed: 'status-closed',
};

const sevColors: Record<string, string> = {
  critical: 'severity-critical',
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
};

const emptyIncident = { title: '', description: '', severity: 'medium', category: '' };
const emptyEvidence = { title: '', evidence_type: 'ioc', value: '', description: '' };

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyIncident);
  const [evidenceForm, setEvidenceForm] = useState(emptyEvidence);
  const [, setUsers] = useState<any[]>([]);

  const loadIncidents = useCallback(() => {
    getIncidents().then((r) => setIncidents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadIncidents();
    getUsers().then((r) => setUsers(r.data)).catch(() => {});
  }, [loadIncidents]);

  const selectIncident = async (inc: any) => {
    const res = await getIncidentDetail(inc.id);
    setSelected(res.data);
    setActiveTab('overview');
  };

  const refreshSelected = async () => {
    if (!selected) return;
    const res = await getIncidentDetail(selected.id);
    setSelected(res.data);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    await createIncident(form);
    setShowCreate(false);
    setForm(emptyIncident);
    loadIncidents();
  };

  const handleStatus = async (status: string) => {
    if (!selected) return;
    await updateIncidentStatus(selected.id, status);
    loadIncidents();
    await refreshSelected();
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selected) return;
    await addIncidentNote(selected.id, { content: newNote, note_type: noteType });
    setNewNote('');
    await refreshSelected();
  };

  const handleAddEvidence = async () => {
    if (!evidenceForm.title.trim() || !evidenceForm.value.trim() || !selected) return;
    await addIncidentEvidence(selected.id, evidenceForm);
    setEvidenceForm(emptyEvidence);
    await refreshSelected();
  };

  const incidentStats = useMemo(() => ({
    open: incidents.filter((i) => ['open', 'investigating'].includes(i.status)).length,
    contained: incidents.filter((i) => i.status === 'contained').length,
    resolved: incidents.filter((i) => ['resolved', 'closed'].includes(i.status)).length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
  }), [incidents]);

  const sla = selected?.sla_deadline ? getSlaState(selected.sla_deadline, selected.status) : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incident Response</h1>
          <p className="text-sm text-[var(--text-muted)] font-mono">Case management, evidence, timelines, and containment workflow</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Incident</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card"><div className="stat-value">{incidentStats.open}</div><div className="stat-label">Active Cases</div></div>
        <div className="stat-card"><div className="stat-value text-purple-400">{incidentStats.contained}</div><div className="stat-label">Contained</div></div>
        <div className="stat-card"><div className="stat-value text-green-400">{incidentStats.resolved}</div><div className="stat-label">Resolved</div></div>
        <div className="stat-card"><div className="stat-value text-red-400">{incidentStats.critical}</div><div className="stat-label">Critical</div></div>
      </div>

      {showCreate && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-lg font-bold">Create Incident</h3>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Incident title" className="input-field" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." className="input-field h-24 resize-none" />
          <div className="flex gap-2">
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="input-field w-auto">
              <option value="critical">Critical</option><option value="high">High</option>
              <option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category, e.g. malware" className="input-field" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(360px,440px)_1fr] gap-4 min-h-[calc(100vh-300px)]">
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => selectIncident(inc)}
              className={`glass-card p-4 cursor-pointer ${selected?.id === inc.id ? 'border-[var(--accent-cyan)]' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColors[inc.severity] || ''}`}>{inc.severity?.toUpperCase()}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${statusColors[inc.status] || ''}`}>{inc.status?.toUpperCase()}</span>
                <span className="text-xs text-[var(--text-muted)] font-mono ml-auto">INC-{inc.id}</span>
              </div>
              <h3 className="text-sm font-semibold truncate">{inc.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] truncate mt-1">{inc.description}</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-[var(--text-muted)]">
                <span>{inc.alert_count || 0} alerts</span>
                <span>{Array.isArray(inc.mitre_techniques) ? inc.mitre_techniques.length : 0} MITRE</span>
                {inc.sla_deadline && <span className="text-[var(--accent-yellow)]">SLA {new Date(inc.sla_deadline).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <p className="text-center py-12 text-[var(--text-muted)] font-mono">No incidents yet. Create one or open an alert as an incident.</p>
          )}
        </div>

        {selected ? (
          <div className="glass-card p-5 max-h-[calc(100vh-300px)] overflow-y-auto animate-slide-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[var(--accent-cyan)]">INC-{selected.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColors[selected.severity] || ''}`}>{selected.severity?.toUpperCase()}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${statusColors[selected.status] || ''}`}>{selected.status?.toUpperCase()}</span>
                </div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{selected.description}</p>
              </div>
              {sla && (
                <div className={`min-w-[160px] p-3 rounded-lg border ${sla.breached ? 'border-red-500/40 bg-red-500/10' : 'border-[var(--border-color)] bg-[var(--bg-input)]'}`}>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">SLA</p>
                  <p className={`text-sm font-bold ${sla.breached ? 'text-red-400' : 'text-[var(--accent-cyan)]'}`}>{sla.label}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-[var(--text-muted)] text-xs font-mono mb-2 block">STATUS WORKFLOW</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button key={status} onClick={() => handleStatus(status)}
                    className={`text-[10px] font-mono px-3 py-1.5 rounded border transition-all ${
                      selected.status === status ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-cyan-500/10' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
                    }`}>
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 border-b border-[var(--border-color)] pb-1 mb-4">
              {(['overview', 'timeline', 'evidence', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium pb-2 transition-all ${
                    activeTab === tab ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && <Overview selected={selected} />}
            {activeTab === 'timeline' && <Timeline events={selected.timeline || []} />}
            {activeTab === 'evidence' && (
              <Evidence
                selected={selected}
                evidenceForm={evidenceForm}
                setEvidenceForm={setEvidenceForm}
                onAdd={handleAddEvidence}
              />
            )}
            {activeTab === 'notes' && (
              <Notes
                notes={selected.notes || []}
                newNote={newNote}
                setNewNote={setNewNote}
                noteType={noteType}
                setNoteType={setNoteType}
                onAdd={handleAddNote}
              />
            )}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-[var(--text-muted)] font-mono">
            Select an incident to open the investigation workspace.
          </div>
        )}
      </div>
    </div>
  );
}

function Overview({ selected }: { selected: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Panel title="Attached Alerts">
        <div className="space-y-2">
          {(selected.alerts || []).map((alert: any) => (
            <div key={alert.id} className="p-3 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColors[alert.severity] || ''}`}>{alert.severity}</span>
                <span className="text-sm font-medium truncate">{alert.title}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">{alert.rule_name} {alert.mitre_technique ? `- ${alert.mitre_technique}` : ''}</p>
            </div>
          ))}
          {(selected.alerts || []).length === 0 && <Empty text="No alerts attached." />}
        </div>
      </Panel>

      <Panel title="Related Assets">
        <div className="space-y-2">
          {(selected.related_assets || []).map((asset: any) => (
            <div key={asset.id} className="p-3 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{asset.hostname}</span>
                <span className="text-xs font-mono text-red-400">Risk {asset.risk_score}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">{asset.ip_address} - {asset.status}</p>
            </div>
          ))}
          {(selected.related_assets || []).length === 0 && <Empty text="No matching assets yet." />}
        </div>
      </Panel>

      <Panel title="IOCs">
        <TagList values={selected.ioc_list || []} color="text-red-400" />
      </Panel>

      <Panel title="MITRE Techniques">
        <TagList values={selected.mitre_techniques || []} color="text-purple-400" />
      </Panel>
    </div>
  );
}

function Timeline({ events }: { events: any[] }) {
  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={`${event.timestamp}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-cyan)] mt-1" />
            {index < events.length - 1 && <div className="w-px flex-1 bg-[var(--border-color)] my-1" />}
          </div>
          <div className="flex-1 p-3 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{event.title}</p>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</span>
            </div>
            {event.detail && <p className="text-xs text-[var(--text-secondary)] mt-1">{event.detail}</p>}
          </div>
        </div>
      ))}
      {events.length === 0 && <Empty text="No timeline events." />}
    </div>
  );
}

function Evidence({ selected, evidenceForm, setEvidenceForm, onAdd }: any) {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-4">
      <div className="space-y-2">
        {(selected.evidence || []).map((item: any) => (
          <div key={item.id || item.title} className="p-3 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-[var(--accent-cyan)] border border-cyan-500/30">{item.type}</span>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
            <p className="text-xs font-mono text-[var(--text-secondary)] break-all">{item.value}</p>
            {item.description && <p className="text-xs text-[var(--text-muted)] mt-1">{item.description}</p>}
          </div>
        ))}
        {(selected.evidence || []).length === 0 && <Empty text="No evidence captured." />}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Add Evidence</h3>
        <input value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} placeholder="Evidence title" className="input-field text-sm" />
        <select value={evidenceForm.evidence_type} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidence_type: e.target.value })} className="input-field text-sm">
          <option value="ioc">IOC</option><option value="log">Log</option><option value="file">File</option><option value="screenshot">Screenshot</option><option value="artifact">Artifact</option>
        </select>
        <input value={evidenceForm.value} onChange={(e) => setEvidenceForm({ ...evidenceForm, value: e.target.value })} placeholder="Value, hash, IP, path, note..." className="input-field text-sm" />
        <textarea value={evidenceForm.description} onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })} placeholder="Description" className="input-field text-sm h-20 resize-none" />
        <button onClick={onAdd} className="btn-primary w-full text-sm">Add Evidence</button>
      </div>
    </div>
  );
}

function Notes({ notes, newNote, setNewNote, noteType, setNoteType, onAdd }: any) {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-4">
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
        {notes.map((note: any) => (
          <div key={note.id} className="p-3 rounded bg-[var(--bg-input)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--accent-cyan)]">{note.note_type}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{note.created_at ? new Date(note.created_at).toLocaleString() : ''}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && <Empty text="No notes yet." />}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Add Note</h3>
        <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="input-field text-sm">
          <option value="general">General</option><option value="timeline">Timeline</option><option value="evidence">Evidence</option><option value="action">Action</option>
        </select>
        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Investigation note..." className="input-field text-sm h-28 resize-none" />
        <button onClick={onAdd} className="btn-primary w-full text-sm">Add Note</button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
      <h3 className="text-xs text-[var(--text-muted)] font-mono mb-3">{title.toUpperCase()}</h3>
      {children}
    </div>
  );
}

function TagList({ values, color }: { values: string[]; color: string }) {
  return values.length ? (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className={`text-xs font-mono px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] ${color}`}>{value}</span>
      ))}
    </div>
  ) : <Empty text="No values recorded." />;
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-[var(--text-muted)] font-mono py-3">{text}</p>;
}

function getSlaState(deadline: string, status: string) {
  if (['resolved', 'closed'].includes(status)) {
    return { breached: false, label: 'Completed' };
  }
  const ms = new Date(deadline).getTime() - Date.now();
  const breached = ms < 0;
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 36e5);
  const minutes = Math.floor((abs % 36e5) / 6e4);
  return { breached, label: breached ? `Breached ${hours}h ${minutes}m` : `${hours}h ${minutes}m left` };
}
