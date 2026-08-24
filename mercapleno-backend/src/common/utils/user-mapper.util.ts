export interface RawUserWithRelations {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: number;
  id_tipo_identificacion?: number;
  numero_identificacion?: string;
  direccion?: string | null;
  fecha_nacimiento?: Date | null;
  email_verified: boolean;
  roles?: { id?: number; nombre: string } | null;
  tipos_identificacion?: { id?: number; nombre: string } | null;
}

export function mapAuthUserResponse(user: RawUserWithRelations) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    id_rol: user.id_rol,
    email_verified: user.email_verified,
    rol: user.roles?.nombre ?? null,
    tipo_documento: user.tipos_identificacion?.nombre ?? null,
  };
}

export function mapAdminUserResponse(user: RawUserWithRelations) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    direccion: user.direccion ?? null,
    fecha_nacimiento: user.fecha_nacimiento ?? null,
    rol: user.roles?.nombre ?? null,
    tipo_identificacion: user.tipos_identificacion?.nombre ?? null,
    numero_identificacion: user.numero_identificacion ?? '',
    id_rol: user.id_rol,
    id_tipo_identificacion: user.id_tipo_identificacion ?? 1,
    email_verified: user.email_verified,
  };
}
