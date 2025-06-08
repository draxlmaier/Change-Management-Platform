// File: src/components/dashboard/KPIInput.tsx
import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { graphTokenRequest } from '../../authConfig';

interface KPIInputProps {
  siteId: string;
  listId: string;
}
interface KPIForm {
  project: string;
  area: string;
  followUpCost: number;
  initiationReason: string;
  basketId: string;
  entryDate: string;
  responsible: string;
  postName: string;
}
export default function KPIInput({ siteId, listId }: KPIInputProps) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? undefined;
  const [form, setForm] = useState<KPIForm>({
    project: 'Lamborghini',
    area: 'Innenraum',
    followUpCost: 0,
    initiationReason: 'demande suite à un changement technique (aeb)',
    basketId: '',
    entryDate: new Date().toISOString().slice(0, 10),
    responsible: '',
    postName: ''
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const graphClient = Client.init({
        authProvider: async done => {
          try {
            const resp = await instance.acquireTokenSilent({ ...graphTokenRequest, account });
            done(null, resp.accessToken);
          } catch (e) {
            done(e as Error, null);
          }
        }
      });
      await graphClient
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .post({
          fields: {
            Project: form.project,
            Area: form.area,
            Followupcost_x002f_BudgetPA: form.followUpCost,
            InitiationReasons: form.initiationReason,
            BucketID: form.basketId,
            Date: form.entryDate,
            BucketResponsible: form.responsible,
            Postname_x002f_ID: form.postName,
          }
        });
      setMsg('Record saved!');
      setForm(f => ({ ...f, followUpCost: 0, basketId: '', responsible: '', postName: '' }));
    } catch {
      setMsg('Error saving record');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && <div className="text-sm">{msg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Project</label>
          <select
            value={form.project}
            onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option>Lamborghini</option>
            <option>BMW</option>
            <option>Mercedes</option>
          </select>
        </div>
        <div>
          <label>Area</label>
          <select
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option>Innenraum</option>
            <option>Autarke</option>
            <option>Cockpit</option>
            <option>Motorblick</option>
          </select>
        </div>
        <div>
          <label>Follow-up Cost / Budget PA (€)</label>
          <input
            type="number"
            value={form.followUpCost}
            onChange={e => setForm(f => ({ ...f, followUpCost: +e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Initiation Reason</label>
          <select
            value={form.initiationReason}
            onChange={e => setForm(f => ({ ...f, initiationReason: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option>demande suite à un changement technique (aeb)</option>
            <option>demande suite une optimisation</option>
            <option>demande suite mail/réunion d'analyse de réclamation</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Basket ID</label>
          <input
            type="text"
            value={form.basketId}
            onChange={e => setForm(f => ({ ...f, basketId: e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            value={form.entryDate}
            onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Responsible</label>
          <input
            type="text"
            value={form.responsible}
            onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <div>
        <label>Post Name / ID</label>
        <input
          type="text"
          value={form.postName}
          onChange={e => setForm(f => ({ ...f, postName: e.target.value }))}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
