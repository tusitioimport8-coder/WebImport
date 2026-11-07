import DB from "../components/DBComponent.js";
import {
  BannerDbRecord,
  GuardarBannerInput,
} from "../interfaces/banner.interface.js";

export class BannerRepository {
  constructor(private readonly db = DB) {}

  async obtenerPorIdentificador(
    identificador: string,
  ): Promise<BannerDbRecord | null> {
    const result = await this.db.excecuteNameQuery<BannerDbRecord>(
      "obtenerBannerPorIdentificador",
      {
        identificador,
      },
    );
    return result?.[0] || null;
  }

  async obtenerTodos(): Promise<BannerDbRecord[]> {
    return (
      (await this.db.excecuteNameQuery<BannerDbRecord>(
        "obtenerTodosLosBanners",
        {},
      )) || []
    );
  }

  async guardarOActualizar(
    payload: GuardarBannerInput,
  ): Promise<BannerDbRecord> {
    const result = await this.db.excecuteNameQuery<BannerDbRecord>(
      "guardarOActualizarBanner",
      {
        identificador: payload.identificador,
        titulo: payload.titulo || "",
        imagenes: JSON.stringify(payload.imagenes), // Convertimos el array a string JSON para Postgres JSONB
        activo: payload.activo ?? true,
      },
    );

    if (!result?.[0]) {
      throw new Error("No se pudo guardar el banner en la base de datos");
    }

    return result[0];
  }

  async eliminarPorIdentificador(identificador: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarBanner", {
      identificador,
    });
  }
}

export default new BannerRepository();
