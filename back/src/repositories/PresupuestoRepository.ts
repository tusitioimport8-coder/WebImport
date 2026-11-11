import DB from "../components/DBComponent.js";
import { IPresupuesto } from "../interfaces/IPresupuesto.js";

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
}

export default new PresupuestoRepository();
