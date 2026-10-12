import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner;
    try {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      html5QrcodeScanner.render((text) => {
        onResult(text);
        html5QrcodeScanner.clear();
      }, (err) => {
        // Ignorar erros de scan contínuo
      });

    } catch (e) {
      console.log(e);
      setError("Erro ao iniciar a câmera. Tente abrir em uma nova guia ou verifique as permissões.");
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error("Failed to clear", e));
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white backdrop-blur-sm z-[70] hover:bg-white/20"
      >
        <X size={24} />
      </button>
      
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden p-4">
        {error ? (
          <div className="p-8 text-center text-rose-500 font-medium">
            {error}
          </div>
        ) : (
          <div id="reader" className="w-full min-h-[300px]"></div>
        )}
        <div className="text-center mt-4 text-slate-500 text-sm font-medium">
          Aponte para o código de barras
        </div>
      </div>
    </div>
  );
}
