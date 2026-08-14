import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { getUnsyncedQueueRecords, flushOfflineSyncQueue } from '@/lib/offlineSyncDB';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const refreshQueueCount = async () => {
    try {
      const records = await getUnsyncedQueueRecords();
      setPendingQueueCount(records.length);
    } catch {
      setPendingQueueCount(0);
    }
  };

  useEffect(() => {
    refreshQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('🌐 Reconnected to Network! Flushing offline queue...');
      setIsSyncing(true);
      const res = await flushOfflineSyncQueue();
      setIsSyncing(false);
      refreshQueueCount();
      if (res.syncedCount > 0) {
        toast.success(`Successfully synchronized ${res.syncedCount} offline record(s) to cloud!`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('⚠️ Network Connection Lost. Operating in Offline Mode (IndexedDB Queue Active).');
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await flushOfflineSyncQueue();
    setIsSyncing(false);
    await refreshQueueCount();
    if (res.syncedCount > 0) {
      toast.success(`Synchronized ${res.syncedCount} record(s).`);
    } else {
      toast.info('No pending offline records to sync.');
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success('E-Kisaan OS PWA App Installed!');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('To install E-Kisaan App, use your browser menu "Add to Home Screen".');
    }
  };

  if (isOnline && pendingQueueCount === 0 && !deferredPrompt) {
    return null; // Clean top banner when fully online and synced
  }

  return (
    <div className={`px-4 py-2.5 shadow-sm text-sm border-b transition-all flex items-center justify-between flex-wrap gap-2 ${
      !isOnline
        ? 'bg-amber-500 text-white border-amber-600'
        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
    }`}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span className="font-bold">Offline Mode</span>
            <span className="text-amber-100 text-xs hidden sm:inline">
              Changes are saved locally in IndexedDB and will sync automatically upon reconnecting.
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-emerald-950">Cloud Sync Active</span>
          </>
        )}

        {pendingQueueCount > 0 && (
          <Badge variant="secondary" className="bg-white/90 text-amber-950 font-bold text-xs ml-1">
            {pendingQueueCount} Pending Log{pendingQueueCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pendingQueueCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="h-8 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Queue Now'}
          </Button>
        )}

        {deferredPrompt && (
          <Button
            size="sm"
            onClick={handleInstallPWA}
            className="h-8 text-xs bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
}
