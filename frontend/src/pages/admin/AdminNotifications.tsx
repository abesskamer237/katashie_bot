import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Bell, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminNotificationsPage() {
  const [notif, setNotif] = useState({ title: '', message: '', type: 'info' as const });
  const [announce, setAnnounce] = useState({ title: '', content: '', type: 'info' as const });

  const notifMutation = useMutation({
    mutationFn: () => adminApi.sendNotification(notif),
    onSuccess: () => { toast.success('Notification envoyée'); setNotif({ title: '', message: '', type: 'info' }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const announceMutation = useMutation({
    mutationFn: () => adminApi.createAnnouncement(announce),
    onSuccess: () => { toast.success('Annonce publiée'); setAnnounce({ title: '', content: '', type: 'info' }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const typeOpts = ['info', 'success', 'warning', 'error'];
  const typeColors: Record<string, string> = { info: 'text-cyan-400', success: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400' };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
        <h1 className="text-xl font-bold">Notifications & Annonces</h1>
      </div>

      {/* Notification */}
      <div className="card">
        <div className="section-title"><Bell className="w-3.5 h-3.5" /> Envoyer une notification globale</div>
        <p className="text-xs text-gray-500 mb-4">La notification apparaîtra dans le panel de tous les utilisateurs.</p>
        <div className="space-y-3">
          <div>
            <label className="label">Titre</label>
            <input type="text" value={notif.title} onChange={e => setNotif({ ...notif, title: e.target.value })}
              className="input-field" placeholder="Titre de la notification" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea value={notif.message} onChange={e => setNotif({ ...notif, message: e.target.value })}
              className="input-field resize-none" rows={3} placeholder="Contenu du message..." />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {typeOpts.map(t => (
                <button key={t} onClick={() => setNotif({ ...notif, type: t as any })}
                  className={`text-xs px-3 py-1.5 border transition-colors capitalize ${notif.type === t ? `border-current ${typeColors[t]}` : 'border-gray-700 text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => notifMutation.mutate()} disabled={notifMutation.isPending || !notif.title || !notif.message}
            className="btn-primary text-sm">
            {notifMutation.isPending ? 'Envoi...' : '> Envoyer à tous'}
          </button>
        </div>
      </div>

      {/* Announcement */}
      <div className="card">
        <div className="section-title"><Megaphone className="w-3.5 h-3.5" /> Publier une annonce</div>
        <p className="text-xs text-gray-500 mb-4">L'annonce s'affichera sur le tableau de bord de tous les utilisateurs.</p>
        <div className="space-y-3">
          <div>
            <label className="label">Titre</label>
            <input type="text" value={announce.title} onChange={e => setAnnounce({ ...announce, title: e.target.value })}
              className="input-field" placeholder="Titre de l'annonce" />
          </div>
          <div>
            <label className="label">Contenu</label>
            <textarea value={announce.content} onChange={e => setAnnounce({ ...announce, content: e.target.value })}
              className="input-field resize-none" rows={4} placeholder="Contenu de l'annonce..." />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {typeOpts.map(t => (
                <button key={t} onClick={() => setAnnounce({ ...announce, type: t as any })}
                  className={`text-xs px-3 py-1.5 border transition-colors capitalize ${announce.type === t ? `border-current ${typeColors[t]}` : 'border-gray-700 text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => announceMutation.mutate()} disabled={announceMutation.isPending || !announce.title || !announce.content}
            className="btn-primary text-sm">
            {announceMutation.isPending ? 'Publication...' : '> Publier l\'annonce'}
          </button>
        </div>
      </div>
    </div>
  );
}
