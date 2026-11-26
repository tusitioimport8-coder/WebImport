import type { TipoPrecioPresupuesto } from "../interfaces/presupuesto.interface.js";

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

const ETIQUETAS_TARIFA: Record<string, string> = {
  detal_bs: "Detal BCV",
  detal_usd: "Detal Divisa",
  mayor: "Precio Mayor",
  granmayor: "Precio Gran Mayor",
  gran_mayor: "Precio Gran Mayor",
};

function formatearTarifa(nivel?: string): string {
  if (!nivel) return "Detal BCV";
  const clave = nivel.trim().toLowerCase();
  return ETIQUETAS_TARIFA[clave] ?? nivel;
}

export function generarLinkWhatsAppHelper(data: DatosWhatsAppInput): string {
  const telefono = data.telefonoEmpresa || "584129668437";
  const orden = data.datosOrden;

  let mensaje = `Hola, me gustaría confirmar el siguiente pedido:\n\n`;

  if (orden.idPedido) {
    mensaje += `*Nro. de Pedido:* ${orden.idPedido.substring(0, 8).toUpperCase()}\n`;
  }

  mensaje += `*Cliente:* ${orden.clienteNombre}\n`;
  if (orden.telefonoCliente) {
    mensaje += `*Teléfono:* ${orden.telefonoCliente}\n`;
  }

  mensaje += `*Tarifa Aplicada:* ${formatearTarifa(orden.nivelAplicado)}\n`;

  if (orden.tipoEntrega) {
    mensaje += `*Tipo de Entrega:* ${orden.tipoEntrega.toUpperCase()}\n`;
  }
  if (orden.metodoPago) {
    mensaje += `*Método de Pago:* ${orden.metodoPago.toUpperCase()}\n\n`;
  }

  mensaje += `*Detalle del Pedido:*\n`;

  orden.items.forEach((item) => {
    mensaje += `• ${item.cantidad}x ${item.nombre} - $${item.subtotal.toFixed(2)}\n`;
  });

  mensaje += `\n*Total a pagar:* $${orden.totalPagar.toFixed(2)}\n\n`;
  mensaje += `¿Me confirman los datos para el pago y envío?`;

  const mensajeFormateado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefono}?text=${mensajeFormateado}`;
}

export interface DatosPresupuestoWhatsAppInput {
  telefonoDestino: string;
  datosPresupuesto: {
    idPresupuesto: string;
    clienteNombre: string;
    telefonoCliente?: string;
    items: Array<{
      nombre: string;
      cantidad: number;
      subtotal: number;
      tipo_precio: TipoPrecioPresupuesto;
    }>;
    total: number;
  };
}

function formatearMontoPresupuesto(
  monto: number,
  tipoPrecio: TipoPrecioPresupuesto,
): string {
  const valor = monto.toFixed(2);
  if (tipoPrecio === "detal_bs") return `$ ${valor}`;
  if (tipoPrecio === "detal_usd") return `$ ${valor}`;
  if (tipoPrecio === "Mayor") return `Mayor: $${valor}`;
  if (tipoPrecio === "GranMayor") return `Gran Mayor: $${valor}`;
  return valor;
}

export function generarLinkPresupuestoWhatsAppHelper(
  data: DatosPresupuestoWhatsAppInput,
): { whatsappUrl: string; mensaje: string } {
  const telefonoLimpio = (data.telefonoDestino || "584129668437").replace(
    /\D/g,
    "",
  );
  const presupuesto = data.datosPresupuesto;

  let mensaje = `Hola ${presupuesto.clienteNombre}, somos *Tu Sitio Import* y este es el presupuesto que nos solicitaste:\n\n`;
  mensaje += `*Presupuesto Nro.:* ${presupuesto.idPresupuesto.substring(0, 8).toUpperCase()}\n\n`;
  mensaje += `*Productos:*\n`;

  for (const item of presupuesto.items) {
    mensaje += `• ${item.cantidad} x ${item.nombre}\n`;
    mensaje += `\t ${formatearTarifa(item.tipo_precio)}: ${formatearMontoPresupuesto(item.subtotal, item.tipo_precio)}\n`;
  }

  const tiposPrecio = new Set(
    presupuesto.items.map((item) => item.tipo_precio),
  );
  const tipoUnico =
    tiposPrecio.size === 1 ? presupuesto.items[0]?.tipo_precio : undefined;
  const total = tipoUnico
    ? formatearMontoPresupuesto(Number(presupuesto.total), tipoUnico)
    : Number(presupuesto.total).toFixed(2);
  mensaje += `\n*Total:* ${total}\n\n`;

  mensaje += `Contamos con métodos super cómodos para que pagues como te sea más fácil:\n`;
  mensaje += `• Zelle.\n`;
  mensaje += `• Efectivo.\n`;
  mensaje += `• Binance (USDT)\n`;
  mensaje += `• Pago Movil / Transferencias.\n`;
  mensaje += `• Cashea\n\n`;

  mensaje += `¿Que forma de pago quieres elegir en este momento? `;

  const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  return { whatsappUrl, mensaje };
}
