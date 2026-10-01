import React, { useState } from 'react';
import { User, Search, CheckCircle2, AlertCircle, X, Shield, Building2 } from 'lucide-react';
import { api } from '../services/wareraApi';

export default function ProfileSyncModal({ isOpen, onClose, onSyncUser, currentUserData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedDossier, setExtractedDossier] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setExtractedDossier(null);

    try {
      const dossier = await api.resolveUserFull(searchQuery.trim());
      setExtractedDossier(dossier);
    } catch (err) {
      setErrorMsg(err.message || 'Error extracting profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSync = () => {
    if (extractedDossier) {
      onSyncUser(extractedDossier);
      onClose();
    }
  };

  const user = extractedDossier?.user;
  const companies = extractedDossier?.companies || [];
  const equipment = extractedDossier?.equipment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs text-xs font-sans">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-base">Link WarEra Account</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Enter any WarEra profile URL, User ID (24-character hex), or in-game username to extract your live companies, production lines, and level.
        </p>

        {/* Input Form */}
        <form onSubmit={handleResolve} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Username, User ID, or profile link..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 text-xs shadow-xs"
          >
            <Search className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Searching...' : 'Extract'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Extracted Dossier Preview */}
        {user && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm font-sans">{user.username}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                      Lv. {user.leveling?.level || 1}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">ID: {user._id}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> READY
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block uppercase">Companies</span>
                <span className="text-sm font-bold text-slate-900">{companies.length}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block uppercase">Total Damage</span>
                <span className="text-sm font-bold text-slate-900">
                  {(user.stats?.damagesCount || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block uppercase">Weapon</span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {equipment?.weapon?.code ? equipment.weapon.code.toUpperCase() : 'NONE'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <span>Test:</span>
            <button
              type="button"
              onClick={() => setSearchQuery('-DonPelayo-')}
              className="text-amber-700 hover:text-amber-800 font-bold underline font-mono text-[11px]"
            >
              -DonPelayo-
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSync}
              disabled={!extractedDossier}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs disabled:opacity-40 transition shadow-xs"
            >
              Link Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
