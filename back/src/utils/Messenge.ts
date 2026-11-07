export interface DatosWhatsAppInput {
  telefonoEmpresa: string;
  datosOrden: {
    idPedido?: string;
    clienteNombre: string;
    telefonoCliente?: string;
    tipoEntrega?: string;
    metodoPago?: string;
    nivelAplicado: string;
    items: Array<{ nombre: string; cantidad: number; subtotal: number }>;
    totalPagar: number;
  };
}

export function generarLinkWhatsAppHelper(data: DatosWhatsAppInput): string {
  const telefono = data.telefonoEmpresa || "584129668437";
  const orden = data.datosOrden;

  let mensaje = `👋 Hola, me gustaría confirmar el siguiente pedido:\n\n`;

  if (orden.idPedido) {
    mensaje += `🆔 *Nro. de Pedido:* ${orden.idPedido.substring(0, 8).toUpperCase()}\n`;
  }

  mensaje += `👤 *Cliente:* ${orden.clienteNombre}\n`;
  if (orden.telefonoCliente)
    mensaje += `📞 *Teléfono:* ${orden.telefonoCliente}\n`;

  mensaje += `🏷️ *Tarifa Aplicada:* ${orden.nivelAplicado}\n`;

  if (orden.tipoEntrega) {
    mensaje += `📦 *Tipo de Entrega:* ${orden.tipoEntrega.toUpperCase()}\n`;
  }
  if (orden.metodoPago) {
    mensaje += `💳 *Método de Pago:* ${orden.metodoPago.toUpperCase()}\n\n`;
  }

  mensaje += `🛒 *Detalle del Pedido:*\n`;

  orden.items.forEach((item) => {
    mensaje += `• ${item.cantidad}x ${item.nombre} - $${item.subtotal.toFixed(2)}\n`;
  });

  mensaje += `\n💰 *Total a pagar:* $${orden.totalPagar.toFixed(2)}\n\n`;
  mensaje += `¿Me confirman los datos para el pago y envío?`;

  const mensajeFormateado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefono}?text=${mensajeFormateado}`;
}
