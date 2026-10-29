import {
  CrearPedidoRequestDTO,
  GuardarPedidoInput,
  ProductoDbRecord,
  TipoPrecio,
} from "../interfaces/Orden.interface.js";
import OrderRepository, {
  OrderRepository as OrderRepoClass,
} from "../repositories/OrderRepository.js";
import { generarLinkWhatsAppHelper } from "../utils/Messenge.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepoClass = OrderRepository,
  ) {}

  /**
   * Determina el nivel de precio aplicable según el volumen y monto base
   */
  public calcularTipoPrecio(
    totalUnidades: number,
    montoBaseDetal: number,
  ): TipoPrecio {
    if (totalUnidades >= 40 && montoBaseDetal >= 200) {
      return "GranMayor";
    }
    if (totalUnidades >= 6 && montoBaseDetal >= 50) {
      return "Mayor";
    }
    return "Detal";
  }

  /**
   * Obtiene el precio unitario buscando el precio base del nivel aplicable
   * y aplicando el descuento una sola vez.
   */
  public obtenerPrecioUnitario(
    producto: ProductoDbRecord,
    tipoPrecio: TipoPrecio,
  ): number {
    // Buscamos el precio que coincida con el nivel o caemos por defecto en "Detal"
    const precioObj =
      producto.precios?.find((p) => p.tipo_precio === tipoPrecio) ||
      producto.precios?.find((p) => p.tipo_precio === "Detal");

    const precioBase = Number(precioObj?.precio ?? 0);
    const descuento = Number(producto.descuento_porcentaje || 0);

    return Number((precioBase * (1 - descuento / 100)).toFixed(2));
  }

  /**
   * Procesa la lógica de negocio completa del checkout de una orden
   */
  async procesarCheckout(
    body: CrearPedidoRequestDTO,
    usuarioId: string | null,
  ) {
    const { contacto, entrega, pago, items, tipo_documento } = body;

    // 1. Validar existencia de productos y calcular montos base
    let totalUnidades = 0;
    let montoBaseDetal = 0;
    const productosValidados = [];

    for (const item of items) {
      const producto = await this.orderRepository.obtenerProductoParaValidacion(
        item.producto_id,
      );
      if (!producto) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.producto_id}`);
      }

      totalUnidades += item.cantidad;

      // Buscamos el precio 'Detal' dentro del arreglo para escalar correctamente el volumen
      const precioDetalObj = producto.precios?.find(
        (p) => p.tipo_precio === "Detal",
      );
      const precioDetal = Number(precioDetalObj?.precio ?? 0);

      montoBaseDetal += precioDetal * item.cantidad;
      productosValidados.push({ producto, cantidad: item.cantidad });
    }

    // 2. Determinar escala de precios (Detal, Mayor, GranMayor)
    const tipoPrecio = this.calcularTipoPrecio(totalUnidades, montoBaseDetal);

    // 3. Procesar ítems, calcular subtotales y armar listado para WhatsApp
    let totalPedido = 0;
    const detallesProcesados = [];
    const itemsParaWhatsApp = [];

    for (const { producto, cantidad } of productosValidados) {
      const precioFinal = this.obtenerPrecioUnitario(producto, tipoPrecio);
      const subtotal = Number((precioFinal * cantidad).toFixed(2));

      totalPedido += subtotal;

      detallesProcesados.push({
        id_producto: producto.id,
        cantidad,
        precio_unitario: precioFinal,
      });

      itemsParaWhatsApp.push({
        nombre: producto.nombre,
        cantidad,
        subtotal,
      });
    }

    // 4. Mapear payload seguro para la Base de Datos
    const payloadPedido: GuardarPedidoInput = {
      id_usuario: usuarioId,
      nombre_completo: contacto.nombre_completo,
      telefono: contacto.telefono,
      correo: contacto.correo,
      sede: contacto.sede,
      direccion_base: contacto.direccion_base,
      tipo_entrega: entrega.tipo,
      datos_entrega: entrega.detalles,
      metodo_pago: pago.metodo,
      total: Number(totalPedido.toFixed(2)),
      tipo_documento: tipo_documento || "pedido", // Asigna 'pedido' por defecto si viene vacío
      detalles: detallesProcesados,
    };

    // 5. Persistir el pedido y sus detalles mediante el Repositorio
    const pedidoCreado =
      await this.orderRepository.guardarPedidoConDetalles(payloadPedido);

    // 6. Generar enlace de integración con WhatsApp
    const whatsappUrl = generarLinkWhatsAppHelper({
      telefonoEmpresa: process.env.WHATSAPP_EMPRESA || "584129668437",
      datosOrden: {
        idPedido: pedidoCreado.id,
        clienteNombre: contacto.nombre_completo,
        telefonoCliente: contacto.telefono,
        tipoEntrega: entrega.tipo,
        metodoPago: pago.metodo,
        nivelAplicado: tipoPrecio,
        items: itemsParaWhatsApp,
        totalPagar: Number(totalPedido.toFixed(2)),
      },
    });

    return {
      pedido: pedidoCreado,
      whatsappUrl,
    };
  }
}

export default new OrderService();
