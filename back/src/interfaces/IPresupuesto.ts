export interface IPresupuesto {
  id: string;
  usuario_id: string | null;
  nombre_cliente: string;
  telefono: string;
  correo: string;
  total: number;
  estado: string; // 'emitido', 'aprobado', etc.
  tipo_documento: string; // 'presupuesto'
  creado_en?: Date;
}
