export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

export type CrearCategoria = Omit<Categoria, "id">;
export type ActualizarCategoria = Partial<Omit<Categoria, "id">>;
export type EliminarCategoria = Pick<Categoria, "id">;
