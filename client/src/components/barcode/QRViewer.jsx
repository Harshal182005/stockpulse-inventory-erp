import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRViewer = ({ value, size = 80 }) => {
  if (!value) return null;

  return (
    <div className="inline-block p-2 bg-white rounded border border-slate-200">
      <QRCodeSVG
        value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
        size={size}
        level="M"
      />
    </div>
  );
};

export default QRViewer;
