import PedidoCompraForm from '../Forms/PedidoCompraForm';

const NuevoPedidoForm = ({ inventario, sugeridos, onCancelar, onGuardarPedido }) => {
  return (
    <PedidoCompraForm
      inventario={inventario}
      sugeridos={sugeridos}
      onCancelar={onCancelar}
      onGuardarPedido={onGuardarPedido}
    />
  );
};

export default NuevoPedidoForm;
