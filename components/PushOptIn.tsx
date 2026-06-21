'use client';

import { useState, useEffect } from 'react';
import { savePushSubscription } from '@/app/aluno/pushActions';
import { useToast } from '@/components/ToastProvider';
import { Bell, BellOff, Loader2 } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushOptIn() {
  const { success, error: toastError, info } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;

      // Pedir permissão ao SO / Browser
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toastError('Permissão para notificações negada.');
        setLoading(false);
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        toastError('Chave VAPID pública não configurada.');
        setLoading(false);
        return;
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      };

      const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
      
      const result = await savePushSubscription(JSON.parse(JSON.stringify(pushSubscription)));
      
      if (result.error) {
        toastError(result.error);
      } else {
        setIsSubscribed(true);
        success('Notificações ativadas! 🔔');
      }
    } catch (err: any) {
      console.error('Erro ao subscrever push', err);
      toastError('Não foi possível ativar notificações no momento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Não suporta
  }

  return (
    <button
      onClick={isSubscribed ? undefined : subscribeToPush}
      disabled={loading || isSubscribed}
      className={`btn btn-sm ${isSubscribed ? 'btn-success' : 'btn-ghost'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.8rem',
        padding: '6px 12px'
      }}
    >
      {loading ? (
        <Loader2 size={14} className="spin" />
      ) : isSubscribed ? (
        <Bell size={14} />
      ) : (
        <BellOff size={14} />
      )}
      {loading ? 'Aguarde...' : isSubscribed ? 'Notificações Ativas' : 'Ativar Notificações'}
    </button>
  );
}
