import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ShieldCheck, AlertCircle, RefreshCcw } from 'lucide-react';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error

  useEffect(() => {
    let scanner;
    if (status === 'scanning') {
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      });

      scanner.render((result) => {
        setScanResult(result);
        setStatus('success');
        scanner.clear();
      }, (error) => {
        // Handle subtle errors if needed
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-6 lg:p-10 relative overflow-hidden text-center"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/30">
          {status === 'scanning' && (
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="h-full w-1/2 bg-neon-green shadow-[0_0_15px_#ccff00]"
            />
          )}
        </div>

        <div className="mb-8">
          <div className="w-20 h-20 bg-neon-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neon-green border border-neon-green/20">
            <QrCode size={40} />
          </div>
          <h2 className="text-2xl font-black italic tracking-tight">GYM CHECK-IN</h2>
          <p className="text-gray-400 mt-2 text-sm">Scan the QR code at the entrance to mark your attendance.</p>
        </div>

        <div className="relative aspect-square w-full max-w-[300px] mx-auto bg-black/40 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
          {status === 'idle' && (
            <button 
              onClick={() => setStatus('scanning')}
              className="flex flex-col items-center gap-3 text-gray-500 hover:text-neon-green transition-colors"
            >
              <RefreshCcw size={48} className="animate-spin-slow" />
              <span className="text-xs font-black uppercase tracking-widest">Start Scanner</span>
            </button>
          )}

          <div id="reader" className={`w-full h-full ${status === 'scanning' ? 'block' : 'hidden'}`}></div>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-neon-green flex flex-col items-center justify-center text-black p-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  <ShieldCheck size={80} />
                </motion.div>
                <h3 className="text-xl font-black mt-4">SCAN SUCCESSFUL</h3>
                <p className="text-sm font-bold opacity-80 mt-1">Check-in confirmed at 08:45 AM</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-6 bg-black text-white px-6 py-2 rounded-lg font-bold text-sm"
                >
                  Done
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center text-white p-6"
              >
                <AlertCircle size={80} />
                <h3 className="text-xl font-black mt-4">SCAN FAILED</h3>
                <p className="text-sm font-bold opacity-80 mt-1 text-center">Invalid QR code or membership expired.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-6 bg-white text-black px-6 py-2 rounded-lg font-bold text-sm"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Check-in</p>
            <p className="font-bold mt-1">Yesterday</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Today's Status</p>
            <p className="font-bold mt-1 text-red-500">Not Scanned</p>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
          Powered by TFC Security Systems
        </p>
      </motion.div>
    </div>
  );
};

export default QRScanner;
