import DB from "../components/DBComponent.js";
import { IPresupuesto } from "../interfaces/IPresupuesto.js";

export class PresupuestoRepository {
  constructor(private readonly db = DB) {}

  async crearPresupuesto(data: {
    id: string;
    usuario_id: string;
    total: number;
  }): Promise<IPresupuesto | null> {
    const result = await this.db.excecuteNameQuery("crearPresupuesto", {
      id: data.id,
      usuario_id: data.usuario_id,
      total: data.total,
    });
    return result?.[0] || null;
  }

  async listarPresupuestos(): Promise<IPresupuesto[]> {
    const result = await this.db.excecuteNameQuery("listarPresupuestos", {});
    return result || [];
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
}

export default new PresupuestoRepository();
