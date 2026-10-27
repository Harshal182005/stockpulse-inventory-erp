import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '../common/Modal';
import BarcodeViewer from './BarcodeViewer';
import QRViewer from './QRViewer';
import { formatCurrency } from '../../utils/formatters';

const BarcodeLabelModal = ({ isOpen, onClose, product }) => {
  const [copies, setCopies] = useState(6);
  const [showQR, setShowQR] = useState(false);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Product Barcode Labels" maxWidth="max-w-3xl">
      <div className="no-print mb-4 flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Number of Labels:
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showQR}
              onChange={(e) => setShowQR(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Include QR Code</span>
          </label>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Sheet</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div id="printable-labels" className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
        {Array.from({ length: copies }).map((_, index) => (
          <div
            key={index}
            className="p-3 bg-white text-slate-900 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-center shadow-xs"
          >
            <div className="text-[11px] font-bold truncate max-w-[180px]">{product.name}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {product.sku}</div>
            <div className="my-1.5">
              {showQR ? (
                <QRViewer value={product.barcode || product.sku} size={64} />
              ) : (
                <BarcodeViewer value={product.barcode || product.sku} width={1.2} height={32} />
              )}
            </div>
            <div className="text-xs font-black text-slate-900">
              MRP: {formatCurrency(product.sellingPrice)}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default BarcodeLabelModal;
