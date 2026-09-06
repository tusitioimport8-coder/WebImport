import { Request, Response } from "express";

interface Mensaje {
  telefonoEmpresa: string; // Ej: "584121234567"
  datosOrden: {
    clienteNombre: string;
    items: Array<{ nombre: string; cantidad: number; subtotal: number }>;
    totalPagar: number;
    nivelAplicado: string;
  };
}

export function generarLinkWhatsApp(req: Request, res: Response): void {
  let data: Mensaje = req.body;

  if (!data || !data.datosOrden) {
    data = {
      telefonoEmpresa: "58412-9668437",
      datosOrden: {
        clienteNombre: "Juan Pérez",
        items: [{ nombre: "Producto A", cantidad: 2, subtotal: 20.0 }],
        totalPagar: 20.0,
        nivelAplicado: "Delale",
      },
    };
  }

  // Construir el cuerpo del mensaje en texto plano usando saltos de línea (\n)
  let mensaje = `👋 Hola, me gustaría procesar el siguiente pedido:\n\n`;
  mensaje += `👤 *Cliente:* ${data.datosOrden.clienteNombre}\n`;
  mensaje += `🏷️ *Tarifa Aplicada:* ${data.datosOrden.nivelAplicado}\n\n`;
  mensaje += `🛒 *Detalle del Pedido:*\n`;

  data.datosOrden.items.forEach((item) => {
    mensaje += `• ${item.cantidad}x ${item.nombre} - $${item.subtotal.toFixed(2)}\n`;
  });

  mensaje += `\n💰 *Total a pagar:* $${data.datosOrden.totalPagar.toFixed(2)}\n\n`;
  mensaje += `¿Me confirman los datos para el pago y envío?`;

  const mensajeFormateado = encodeURIComponent(mensaje);

  res.json({
    mensaje: "Link de WhatsApp generado correctamente",
    url: `https://wa.me/${data.telefonoEmpresa}?text=${mensajeFormateado}`,
  });
}
