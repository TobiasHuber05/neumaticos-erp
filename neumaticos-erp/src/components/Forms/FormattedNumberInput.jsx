import React from 'react';

const FormattedNumberInput = ({ value, onChange, className, placeholder = '0', max, ...props }) => {
  // Función para formatear a separador de miles con punto
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '';
    // Eliminar todo lo que no sea número
    const numericStr = String(val).replace(/\D/g, '');
    if (!numericStr) return '';
    // Formatear con puntos
    return new Intl.NumberFormat('es-PY').format(Number(numericStr));
  };

  const handleChange = (e) => {
    // Eliminar puntos para obtener el valor numérico real
    const rawValue = e.target.value.replace(/\./g, '');
    
    // Validar si el string resultante contiene solo dígitos
    if (/^\d*$/.test(rawValue)) {
      const numValue = rawValue === '' ? '' : Number(rawValue);
      
      if (max !== undefined && numValue > max) {
          return;
      }

      onChange(numValue);
    }
  };

  return (
    <input
      type="text"
      value={formatValue(value)}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default FormattedNumberInput;
