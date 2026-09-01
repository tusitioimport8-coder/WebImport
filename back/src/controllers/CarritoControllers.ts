import { Request, Response } from "express";
import CarritoRepository from "../repositories/CarritoRepository.js";
import {
  TipoPrecio,
  NotificacionProgreso,
  CarritoItemRaw,
  CarritoItemFormateado,
  CarritoResponseData,
} from "../interfaces/carrito.interface.js";

export class CarritoController {
  constructor(private readonly carritoRepository = CarritoRepository) {}

  private resolveUserId(req: Request): string | null {
    const user = (req as any).user || req.session?.user;
    return user?.id ? String(user.id) : null;
  }

  /**
   * GET /api/carrito
   * Retorna el detalle procesado del carrito activo con sus ítems, totales y notificaciones.
   */
  async obtenerCarrito(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.resolveUserId(req);
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const carritoData = await this.procesarCarritoUsuario(usuarioId);
      return res.json({ success: true, data: carritoData });
    } catch (error: any) {
      console.error("Error al obtener el carrito:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener el carrito", details: error.message });
    }
  }

  /**
   * POST /api/carrito
   * Agrega o incrementa un producto y devuelve el carrito actualizado.
   */
  async agregarItem(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.resolveUserId(req);
      const { producto_id, cantidad } = req.body;

      if (!usuarioId)
        return res.status(401).json({ error: "Usuario no autenticado" });
      if (!producto_id || !cantidad || Number(cantidad) <= 0) {
        return res
          .status(400)
          .json({
            error:
              "Parámetros 'producto_id' y 'cantidad' (mayor a 0) son obligatorios",
          });
      }

      const carrito =
        await this.carritoRepository.obtenerOCrearCarrito(usuarioId);
      await this.carritoRepository.agregarOIncrementarItem({
        carrito_id: carrito.id,
        producto_id: String(producto_id),
        cantidad: Number(cantidad),
      });

      const carritoData = await this.procesarCarritoUsuario(usuarioId);
      return res.json({
        success: true,
        message: "Producto agregado al carrito exitosamente",
        data: carritoData,
      });
    } catch (error: any) {
      console.error("Error al agregar producto al carrito:", error);
      return res
        .status(500)
        .json({ error: "Error al agregar producto", details: error.message });
    }
  }

  /**
   * PUT /api/carrito/:productoId
   * Establece la cantidad exacta de un producto en el carrito.
   */
  async actualizarCantidad(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.resolveUserId(req);
      const { productoId } = req.params;
      const { cantidad } = req.body;

      if (!usuarioId)
        return res.status(401).json({ error: "Usuario no autenticado" });
      if (!productoId || cantidad === undefined || Number(cantidad) < 0) {
        return res
          .status(400)
          .json({ error: "Parámetro 'cantidad' válido es obligatorio" });
      }

      const carrito =
        await this.carritoRepository.obtenerOCrearCarrito(usuarioId);

      // Si la cantidad solicitada es 0, se remueve el producto
      if (Number(cantidad) === 0) {
        await this.carritoRepository.eliminarItem(
          carrito.id,
          String(productoId),
        );
      } else {
        await this.carritoRepository.actualizarCantidadItem({
          carrito_id: carrito.id,
          producto_id: String(productoId),
          cantidad: Number(cantidad),
        });
      }

      const carritoData = await this.procesarCarritoUsuario(usuarioId);
      return res.json({
        success: true,
        message: "Cantidad actualizada exitosamente",
        data: carritoData,
      });
    } catch (error: any) {
      console.error("Error al actualizar cantidad:", error);
      return res
        .status(500)
        .json({
          error: "Error al actualizar cantidad",
          details: error.message,
        });
    }
  }

  /**
   * DELETE /api/carrito/:productoId
   * Remueve un producto específico de la cesta.
   */
  async eliminarProducto(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.resolveUserId(req);
      const { productoId } = req.params;

      if (!usuarioId)
        return res.status(401).json({ error: "Usuario no autenticado" });
      if (!productoId)
        return res.status(400).json({ error: "El 'productoId' es requerido" });

      const carrito =
        await this.carritoRepository.obtenerOCrearCarrito(usuarioId);
      await this.carritoRepository.eliminarItem(carrito.id, String(productoId));

      const carritoData = await this.procesarCarritoUsuario(usuarioId);
      return res.json({
        success: true,
        message: "Producto eliminado del carrito",
        data: carritoData,
      });
    } catch (error: any) {
      console.error("Error al eliminar producto:", error);
      return res
        .status(500)
        .json({ error: "Error al eliminar producto", details: error.message });
    }
  }

  /**
   * DELETE /api/carrito
   * Elimina todos los ítems del carrito activo del usuario.
   */
  async vaciarCarrito(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.resolveUserId(req);
      if (!usuarioId)
        return res.status(401).json({ error: "Usuario no autenticado" });

      const carrito =
        await this.carritoRepository.obtenerOCrearCarrito(usuarioId);
      await this.carritoRepository.vaciarCarrito(carrito.id);

      const carritoData = await this.procesarCarritoUsuario(usuarioId);
      return res.json({
        success: true,
        message: "Carrito vaciado exitosamente",
        data: carritoData,
      });
    } catch (error: any) {
      console.error("Error al vaciar el carrito:", error);
      return res
        .status(500)
        .json({ error: "Error al vaciar el carrito", details: error.message });
    }
  }

  /**
   * Helper privado: Recopila datos del repository, evalúa reglas de negocio y construye la respuesta final.
   */
  private async procesarCarritoUsuario(
    usuarioId: string,
  ): Promise<CarritoResponseData> {
    const carrito =
      await this.carritoRepository.obtenerOCrearCarrito(usuarioId);
    const itemsRaw: CarritoItemRaw[] =
      await this.carritoRepository.obtenerProductosCarritoRaw(usuarioId);

    // 1. Totales evaluados a tarifa base 'Detal'
    const totalUnidades = itemsRaw.reduce(
      (acc, item) => acc + Number(item.cantidad),
      0,
    );
    const montoBaseDetal = itemsRaw.reduce(
      (acc, item) => acc + Number(item.cantidad) * Number(item.precio_detal),
      0,
    );

    // 2. Determinar Nivel Aplicable segun reglas de negocio
    let nivelCalculado: TipoPrecio = "Detal";
    if (totalUnidades >= 40 && montoBaseDetal >= 200) {
      nivelCalculado = "GranMayor";
    } else if (totalUnidades >= 6 && montoBaseDetal >= 50) {
      nivelCalculado = "Mayor";
    }

    // 3. Formatear productos aplicando la tarifa correspondiente
    let totalCarrito = 0;
    const itemsFormateados: CarritoItemFormateado[] = itemsRaw.map((item) => {
      let precioAplicado = Number(item.precio_detal);
      if (nivelCalculado === "Mayor")
        precioAplicado = Number(item.precio_mayor);
      if (nivelCalculado === "GranMayor")
        precioAplicado = Number(item.precio_gran_mayor);

      const descuento = Number(item.descuento_porcentaje || 0);
      const precioConDescuento = Number(
        (precioAplicado * (1 - descuento / 100)).toFixed(2),
      );
      const subtotal = Number(
        (precioConDescuento * Number(item.cantidad)).toFixed(2),
      );

      totalCarrito += subtotal;

      return {
        item_id: item.item_id,
        producto_id: item.producto_id,
        nombre: item.nombre,
        imagen_url: item.imagen_url,
        cantidad: Number(item.cantidad),
        tipo_precio_aplicado: nivelCalculado,
        precio_unitario: precioAplicado,
        descuento_porcentaje: descuento,
        precio_final: precioConDescuento,
        subtotal,
      };
    });

    // 4. Notificacion de progreso
    const notificacion = this.calcularNotificacion(
      nivelCalculado,
      totalUnidades,
      montoBaseDetal,
    );

    return {
      carrito_id: carrito.id,
      resumen: {
        nivel_aplicado: nivelCalculado,
        total_unidades: totalUnidades,
        total_pagar: Number(totalCarrito.toFixed(2)),
      },
      notificacion,
      items: itemsFormateados,
    };
  }

  /**
   * Helper privado: Calcula las metas faltantes y construye el objeto NotificacionProgreso.
   */
  private calcularNotificacion(
    nivel: TipoPrecio,
    unidades: number,
    monto: number,
  ): NotificacionProgreso {
    if (nivel === "GranMayor") {
      return {
        mensaje: "¡Felicidades! Tienes tarifa máxima al Gran Mayor.",
        nivel_actual: "GranMayor",
        siguiente_nivel: null,
        progreso_porcentaje: 100,
        faltante_unidades: 0,
        faltante_monto: 0,
      };
    }

    const metaUnidades = nivel === "Mayor" ? 40 : 6;
    const metaMonto = nivel === "Mayor" ? 200 : 50;
    const siguienteNivel: TipoPrecio =
      nivel === "Mayor" ? "GranMayor" : "Mayor";

    const faltanteUnidades = Math.max(0, metaUnidades - unidades);
    const faltanteMonto = Math.max(0, metaMonto - monto);

    const progresoUnidades = Math.min(100, (unidades / metaUnidades) * 100);
    const progresoMonto = Math.min(100, (monto / metaMonto) * 100);
    const progresoPorcentaje = Number(
      ((progresoUnidades + progresoMonto) / 2).toFixed(1),
    );

    return {
      mensaje: `Estás en nivel ${nivel}. Agrega ${faltanteUnidades} productos más o $${faltanteMonto.toFixed(
        2,
      )} para desbloquear precios al ${siguienteNivel}.`,
      nivel_actual: nivel,
      siguiente_nivel: siguienteNivel,
      progreso_porcentaje: progresoPorcentaje,
      faltante_unidades: faltanteUnidades,
      faltante_monto: Number(faltanteMonto.toFixed(2)),
    };
  }
}
