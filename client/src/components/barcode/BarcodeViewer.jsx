import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeViewer = ({ value, format = 'CODE128', width = 1.5, height = 40, displayValue = true }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format,
          width,
          height,
          displayValue,
          fontSize: 12,
          margin: 4,
          background: 'transparent',
          lineColor: '#1e293b',
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return (
    <div className="inline-block p-1 bg-white rounded border border-slate-200">
      <svg ref={svgRef} />
    </div>
  );
};

export default BarcodeViewer;
