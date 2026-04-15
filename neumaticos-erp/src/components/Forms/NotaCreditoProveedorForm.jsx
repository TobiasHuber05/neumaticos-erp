import { useState } from 'react';
import { X, Receipt } from 'lucide-react';

const NotaCreditoProveedorForm = ({ notaDevolucion, onCancelar, onGuardar }) => {
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState(String(notaDevolucion.total ?? ''));

  const handleGuardar = () => {
    onGuardar({ numero, fecha, monto: Number(monto) });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border max-w-md w-full">
      <div className="bg-gray-800 p-4 flex justify-between items-center rounded-t-xl">
        <h3 className="text-white font-bold text-sm">Nota de crédito del proveedor</h3>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-gray-700 rounded-full p-1">
          <X size={20} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-gray-600">
          Por devolución <span className="font-bold">{notaDevolucion.numero}</span> (total ref. Gs.{' '}
          {Number(notaDevolucion.total).toLocaleString('de-DE')})
        </p>
        <div>
          <label className="text-xs font-bold text-gray-600">Número NC</label>
          <input value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Monto (Gs.)</label>
          <input
            type="number"
            min={0}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>
      </div>
      <div className="p-4 border-t flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="px-3 py-2 text-sm font-bold bg-gray-800 text-white rounded-lg flex items-center gap-2"
        >
          <Receipt size={16} /> Registrar NC
        </button>
      </div>
    </div>
  );
};

export default NotaCreditoProveedorForm;
