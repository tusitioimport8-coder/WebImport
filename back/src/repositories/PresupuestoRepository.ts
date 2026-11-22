import DB from "../components/DBComponent.js";
import {
  IPresupuesto,
  EditarPresupuestoDetalleInput,
  EditarPresupuestoPayload,
  TipoPrecioPresupuesto,
} from "../interfaces/presupuesto.interface.js";
import ProductRepository from "./ProductRepository.js";

export class PresupuestoRepository {
  constructor(private readonly db = DB) {}

  async crearPresupuesto(data: {
    id?: string;
    nombre_cliente: string;
    telefono_cliente?: string;
    descuento?: number;
    total: number;
    detalles: Array<{
      producto_id: string;
      cantidad: number;
      precio_unitario: number;
      tipo_precio: string;
    }>;
  }): Promise<IPresupuesto | null> {
    // Generar ID si no viene incluido
    const presupuestoId = data.id || crypto.randomUUID();

    // 1. Insertar la cabecera del presupuesto
    const cabeceraResult = await this.db.excecuteNameQuery("crearPresupuesto", {
      id: presupuestoId,
      nombre_cliente: data.nombre_cliente,
      telefono_cliente: data.telefono_cliente || null,
      descuento: data.descuento || 0,
      total: data.total,
    });

    const presupuestoCreado = cabeceraResult?.[0];
    if (!presupuestoCreado) return null;

    // 2. Insertar cada producto asociado en la tabla de detalles
    if (data.detalles && data.detalles.length > 0) {
      for (const item of data.detalles) {
        await this.db.excecuteNameQuery("crearPresupuestoDetalle", {
          presupuesto_id: presupuestoId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          tipo_precio: item.tipo_precio,
        });
      }
    }

    // 3. Retornar el presupuesto completo con sus detalles anidados
    return await this.obtenerPresupuestoPorId(presupuestoId);
  }

  async listarPresupuestos(): Promise<IPresupuesto[]> {
    const result = await this.db.excecuteNameQuery("listarPresupuestos", {});
    return result || [];
  }

  async obtenerPresupuestoPorId(id: string): Promise<IPresupuesto | null> {
    const result = await this.db.excecuteNameQuery("obtenerPresupuestoPorId", {
      id,
    });
    return result?.[0] || null;
  }

  async actualizarEstadoPresupuesto(
    id: string,
    estado: string,
  ): Promise<IPresupuesto | null> {
    const result = await this.db.excecuteNameQuery(
      "actualizarEstadoPresupuesto",
      {
        estado,
        id,
      },
    );
    return result?.[0] || null;
  }

  async eliminarPresupuesto(id: string): Promise<boolean> {
    const result = await this.db.excecuteNameQuery("eliminarPresupuesto", {
      id,
    });
    return !!result?.[0];
  }

  async obtenerDetallesPorPresupuestoId(presupuestoId: string): Promise<
    Array<{
      id: string;
      presupuesto_id: string;
      producto_id: string;
      cantidad: number;
      precio_unitario: number;
      tipo_precio?: string;
    }>
  > {
    const result = await this.db.excecuteNameQuery(
      "obtenerDetallesPorPresupuestoId",
      { presupuesto_id: presupuestoId },
    );
    return result || [];
  }

  async editarPresupuesto(
    payload: EditarPresupuestoPayload,
  ): Promise<IPresupuesto | null> {
    const actual = await this.obtenerPresupuestoPorId(payload.id);
    if (!actual) {
      return null;
    }

    let totalCalculado = payload.total;

    if (Array.isArray(payload.detalles)) {
      let subtotal = 0;
      const detallesPreparados: Array<{
        presupuesto_id: string;
        producto_id: string;
        cantidad: number;
        precio_unitario: number;
        tipo_precio: TipoPrecioPresupuesto;
      }> = [];

      for (const item of payload.detalles as EditarPresupuestoDetalleInput[]) {
        const producto = await ProductRepository.getProductoPorId(
          item.producto_id,
        );
        if (!producto) {
          throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
        }

        const calculado = this.resolverPrecio(
          producto.precios ?? [],
          item.cantidad,
          item.precio_unitario,
          item.tipo_precio,
        );
        detallesPreparados.push({
          presupuesto_id: payload.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: calculado.precio_unitario,
          tipo_precio: calculado.tipo_precio,
        });

        subtotal += calculado.precio_unitario * item.cantidad;
      }

      await this.db.excecuteNameQuery("eliminarDetallesPorPresupuestoId", {
        presupuesto_id: payload.id,
      });
      for (const detalle of detallesPreparados) {
        await this.db.excecuteNameQuery("crearPresupuestoDetalle", detalle);
      }

      if (payload.total === undefined) {
        const descuento =
          payload.descuento ?? Number(actual.descuento ?? 0);
        totalCalculado =
          subtotal * (1 - Math.max(0, Math.min(100, descuento)) / 100);
      }
    }

    await this.db.excecuteNameQuery("actualizarPresupuesto", {
      id: payload.id,
      nombre_cliente: payload.nombre_cliente ?? null,
      telefono_cliente: payload.telefono_cliente ?? null,
      descuento: payload.descuento ?? null,
      total: totalCalculado ?? null,
      estado: payload.estado ?? null,
    });

    return await this.obtenerPresupuestoPorId(payload.id);
  }

  private resolverPrecio(
    precios: Array<{ tipo_precio: TipoPrecioPresupuesto; precio: number }>,
    cantidad: number,
    precioSolicitado?: number,
    tipoSolicitado?: TipoPrecioPresupuesto,
  ): { precio_unitario: number; tipo_precio: TipoPrecioPresupuesto } {
    const tipo =
      tipoSolicitado ??
      (cantidad >= 12
        ? "GranMayor"
        : cantidad >= 6
          ? "Mayor"
          : "detal_usd");
    const precioCatalogo = precios.find(
      (precio) => precio.tipo_precio === tipo,
    )?.precio;

    if (precioCatalogo !== undefined) {
      return {
        precio_unitario: Number(precioCatalogo),
        tipo_precio: tipo,
      };
    }

    const precioFallback = precios.find(
      (precio) =>
        precio.tipo_precio === "detal_usd" ||
        precio.tipo_precio === "detal_bs",
    );
    return {
      precio_unitario:
        precioSolicitado ??
        (precioFallback ? Number(precioFallback.precio) : 0),
      tipo_precio:
        tipoSolicitado ?? precioFallback?.tipo_precio ?? "detal_usd",
    };
  }
}

export default new PresupuestoRepository();
