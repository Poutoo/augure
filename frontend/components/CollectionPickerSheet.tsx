"use client";

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  ApiFavoriteCollection,
  apiGetMyCollections,
  apiCheckCollections,
  apiAddToCollection,
  apiRemoveFromCollection,
  apiCreateCollection,
} from '@/lib/api';

interface Props {
  token: string;
  threadId?: string;
  trendId?: string;
  onClose: () => void;
}

export default function CollectionPickerSheet({ token, threadId, trendId, onClose }: Props) {
  const [collections, setCollections] = useState<ApiFavoriteCollection[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetMyCollections(token),
      apiCheckCollections(token, { thread_id: threadId, trend_id: trendId }),
    ]).then(([cols, check]) => {
      setCollections(cols);
      setCheckedIds(new Set(check.collection_ids));
      setLoading(false);
    });
  }, [token, threadId, trendId]);

  async function toggleCollection(col: ApiFavoriteCollection) {
    setToggling(col.id);
    try {
      if (checkedIds.has(col.id)) {
        await apiRemoveFromCollection(token, col.id, { thread_id: threadId, trend_id: trendId });
        setCheckedIds(prev => { const s = new Set(prev); s.delete(col.id); return s; });
      } else {
        await apiAddToCollection(token, col.id, { thread_id: threadId, trend_id: trendId });
        setCheckedIds(prev => new Set([...prev, col.id]));
      }
    } finally {
      setToggling(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await apiCreateCollection(token, { name: newName.trim(), emoji: '🔖' });
      setCollections(prev => [col, ...prev]);
      setNewName('');
      setShowCreate(false);
      await apiAddToCollection(token, col.id, { thread_id: threadId, trend_id: trendId });
      setCheckedIds(prev => new Set([...prev, col.id]));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white w-full max-w-lg rounded-t-[32px] shadow-2xl z-10 flex flex-col max-h-[75vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-syne font-bold text-base text-[var(--color-text-dark)]">Ajouter aux collections</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <Icon icon="mdi:close" className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col)}
                  disabled={toggling === col.id}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-b from-gray-200 to-gray-300">
                    {col.cover_image_url && (
                      <img src={col.cover_image_url} alt={col.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-syne font-semibold text-sm text-[var(--color-text-dark)] truncate">{col.name}</p>
                    <p className="font-syne text-xs text-gray-400">{col.item_count} item{col.item_count !== 1 ? 's' : ''}</p>
                  </div>
                  {toggling === col.id ? (
                    <Icon icon="mdi:loading" className="text-gray-400 animate-spin flex-shrink-0" />
                  ) : checkedIds.has(col.id) ? (
                    <Icon icon="mdi:check-circle" className="text-[var(--color-text-dark)] text-xl flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                </button>
              ))}

              {collections.length === 0 && !showCreate && (
                <p className="text-center font-syne text-sm text-gray-400 py-4">Aucune collection pour l&apos;instant</p>
              )}
            </div>
          )}

          {/* Créer une collection */}
          {showCreate ? (
            <div className="px-4 pb-4 flex flex-col gap-3">
              <p className="font-syne font-bold text-xs text-gray-400 uppercase tracking-wider">Nouvelle collection</p>

              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Nom de la collection"
                autoFocus
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-syne text-sm focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-syne font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-text-dark)] text-white font-syne font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity"
                >
                  {creating && <Icon icon="mdi:loading" className="animate-spin text-sm" />}
                  Créer
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-syne font-semibold text-sm hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Icon icon="mdi:plus" />
                Nouvelle collection
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
