import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            {/* Si quieres mostrar los números de página puedes agregarlos aquí */}
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Siguiente</span>
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Invertir el arreglo (más nuevos primero) asumiendo que vienen por defecto más viejos a más nuevos,
  // O ordenarlos por id/fecha. Como la base de datos a veces los trae por orden de ID ascendente,
  // revertirlos `[...items].reverse()` es una forma simple de poner los más nuevos arriba.
  // Pero lo ideal es que ya vengan ordenados. Si el usuario pidió "más nuevo al más antiguo",
  // lo hacemos revirtiendo la lista original si asumimos que están en orden de creación ascendente.
  // Si ya vienen ordenados descendentes desde la API (ej: orderBy: { id: 'desc' }), revertirlos aquí lo rompería.
  // Por precaución dejaremos la data como está y si necesita orden descendente se puede hacer un reverse condicional.
  // De hecho, en Node solemos hacer `orderBy: desc`, así que confiaré en que la lista base ya pueda estar revertida.
  // Pero el usuario pidió: "que el orden de todas las tablas sea del más nuevo al más antiguo". 
  // Voy a forzar el reverso aquí asumiendo que los IDs más altos son los más nuevos (ordenados por ID desc).

  const sortedItems = React.useMemo(() => {
    // Intentaremos ordenarlos por ID descendente de forma segura, si tienen ID
    if (!items || items.length === 0) return [];

    // Verificamos si el primero tiene ID mayor al último (ya está desc)
    const firstId = items[0]?.id || items[0]?.id_orden_compra || items[0]?.id_pedido;
    const lastId = items[items.length - 1]?.id || items[items.length - 1]?.id_orden_compra || items[items.length - 1]?.id_pedido;

    if (firstId !== undefined && lastId !== undefined && firstId < lastId) {
      return [...items].reverse();
    }
    return items;
  }, [items]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;

  // Asegurarnos que la página actual sea válida
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
  };
}

export default Pagination;
