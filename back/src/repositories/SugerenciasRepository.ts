import DB from "../components/DBComponent.js";

class SugerenciasRepository {
  constructor(private readonly db = DB) {}

  async agregarSugerencia(
    usuario_id: string,
    producto_id: string,
    tipo_evento: string,
    peso: number,
  ): Promise<void> {
    await this.db.excecuteNameQuery("agregarSugerencia", {
      usuario_id,
      producto_id,
      tipo_evento,
      peso,
    });
  }

  async obtenerSugerencias(usuario_id: string, limite: number): Promise<any[]> {
    const result = await this.db.excecuteNameQuery("obtenerSugerencias", {
      usuario_id,
      limite,
    });
    return result || [];
  }
}

export default new SugerenciasRepository();
