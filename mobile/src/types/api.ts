/** Tipos del swagger SubastAR (Doc/swagger_subastar.yaml). */

export type Categoria = 'COMUN' | 'ESPECIAL' | 'PLATA' | 'ORO' | 'PLATINO';
export type Moneda = 'ARS' | 'USD';
export type EstadoSubasta = 'PROGRAMADA' | 'ABIERTA' | 'CERRADA' | 'EN_CURSO';
export type EstadoUsuario = 'PENDIENTE_VERIFICACION' | 'APROBADO' | 'SUSPENDIDO';
export type TipoMedioPago = 'CUENTA_BANCARIA' | 'TARJETA_CREDITO' | 'CHEQUE_CERTIFICADO';
export type TipoNotificacion =
  | 'CUENTA_APROBADA'
  | 'COMPLETAR_REGISTRO'
  | 'VENTA_GANADA'
  | 'PAGO_REQUERIDO'
  | 'MULTA_APLICADA'
  | 'CONSIGNACION_ACEPTADA'
  | 'CONSIGNACION_RECHAZADA'
  | 'OFERTA_BASE_PROPUESTA'
  | 'BIEN_DEVUELTO';
export type EstadoConsignacion =
  | 'ENVIADA'
  | 'EN_INSPECCION'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'EN_SUBASTA'
  | 'VENDIDA';

export interface LoginRequest {
  documento: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

export interface UserSummary {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  documento?: string;
  categoria: Categoria;
  estado?: EstadoUsuario;
}

export interface UserProfile extends UserSummary {
  domicilioLegal?: string;
  paisOrigen?: string;
  tieneMulta?: boolean;
  montoPendienteMulta?: number;
  subastaActivaId?: string | null;
}

export interface UserMetrics {
  totalGastado: number;
  subastasParticipadas: number;
  subastasGanadas: number;
  tasaExito: number;
  mayorPuja: number;
  categorias?: { categoria: Categoria; participaciones: number }[];
}

export interface Auction {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaHoraInicio: string;
  ubicacion?: string;
  categoriaRequerida: Categoria;
  moneda: Moneda;
  estado: EstadoSubasta;
  streamingUrl?: string | null;
  rematador?: { id: string; nombre: string; matricula?: string };
  usuarioPuedeParticipar?: boolean;
  usuarioPuedePujar?: boolean;
  motivoNoPuede?: string | null;
}

export interface AuctionPage {
  content: Auction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ObraArte {
  artista?: string;
  fecha?: string;
  historia?: string;
}

export interface Piece {
  id: string;
  numero?: number;
  descripcion: string;
  precioBase: number;
  moneda: Moneda;
  fotos: string[];
  obraArte?: ObraArte | null;
  vendido?: boolean;
  precioVenta?: number | null;
  mejorOferta?: number;
}

export interface Bid {
  id: string;
  subastaId?: string;
  piezaId?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  monto: number;
  moneda?: Moneda;
  timestamp: string;
  ganadora?: boolean;
}

export interface BidPage {
  content: Bid[];
  page: number;
  size: number;
  totalElements: number;
}

export interface BidRequest {
  piezaId: string;
  monto: number;
  medioPagoId?: string;
}

export interface MedioPago {
  id: string;
  tipo: TipoMedioPago;
  proveedor: string;
  ultimosDigitos?: string;
  verificado: boolean;
  montoGarantia?: number | null;
}

export interface AddPaymentMethodRequest {
  tipo: TipoMedioPago;
  proveedor: string;
  ultimosDigitos?: string;
  montoGarantia?: number;
}

export interface PolizaSeguro {
  id: string;
  aseguradora: string;
  numeroPoliza: string;
  valorAsegurado: number;
  contactoAseguradora?: string;
}

export interface Consignment {
  id: string;
  nombreBien: string;
  descripcionDetallada: string;
  historia?: string;
  fotos: string[];
  declaraPropiedad: boolean;
  declaraOrigenLicito: boolean;
  estado: EstadoConsignacion;
  valorBaseOfrecido?: number | null;
  comision?: number | null;
  polizaSeguro?: PolizaSeguro | null;
  ubicacionDeposito?: string | null;
  subastaAsignadaId?: string | null;
  fechaSubastaAsignada?: string | null;
  motivoRechazo?: string | null;
  gastosDevolucion?: number | null;
}

export interface CreateConsignmentRequest {
  nombreBien: string;
  descripcionDetallada: string;
  historia?: string;
  fotos: string[];
  declaraPropiedad: boolean;
  declaraOrigenLicito: boolean;
}

export interface Notification {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  referenciaId?: string | null;
}

export interface NotificationPage {
  content: Notification[];
  page: number;
  size: number;
  totalElements: number;
}

export interface Sale {
  id: string;
  subastaId: string;
  piezaId: string;
  nombreBien: string;
  precio: number;
  moneda: Moneda;
  comisiones: number;
  costoEnvio: number;
  medioPago?: MedioPago;
  fecha: string;
}
