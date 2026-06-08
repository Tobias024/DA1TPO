/** Tipos del swagger SubastAR (Doc/swagger_subastar.yaml). */

export type Categoria = 'COMUN' | 'ESPECIAL' | 'PLATA' | 'ORO' | 'PLATINO';
export type Moneda = 'ARS' | 'USD';
export type EstadoSubasta = 'PROXIMA' | 'ABIERTA' | 'EN_CURSO' | 'CERRADA' | 'CANCELADA';
export type EstadoPieza = 'EN_DEPOSITO' | 'EN_EXHIBICION' | 'EN_SUBASTA' | 'ADJUDICADO' | 'VENDIDO' | 'DEVUELTO' | 'RETIRADO';
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
  | 'PENDIENTE'
  | 'EN_INSPECCION'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'PENDIENTE_CONFIRMACION_USUARIO'
  | 'EN_SUBASTA'
  | 'VENDIDO'
  | 'DEVUELTO';

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
  descripcion: string;
  precioBase: number;
  // Campos reales del backend (Pieza):
  numeroItem?: number;
  estado?: EstadoPieza;
  imagenes?: string[];
  mejorOferta?: number;
  // Ventana de puja del ítem
  inicioPuja?: string | null;
  finPuja?: string | null;
  estadoPuja?: 'ABIERTO' | 'CERRADO' | 'PROXIMO';
  // ObraArte: cuando la pieza es una obra de arte, estos campos vienen inline.
  artista?: string;
  fechaObra?: string;
  historia?: string;
  depositoNombre?: string;
  depositoDireccion?: string;
  depositoSector?: string;
  // Opcionales/legacy usados por algunas pantallas (no siempre presentes):
  numero?: number;
  moneda?: Moneda;
  fotos?: string[];
  obraArte?: ObraArte | null;
  vendido?: boolean;
  precioVenta?: number | null;
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
  moneda?: Moneda;
  verificado: boolean;
  proveedor: string;
  ultimosDigitos?: string;
  // Tarjeta de crédito (datos enmascarados)
  titular?: string;
  numeroMasked?: string;
  vencimiento?: string;
  codigoMasked?: string;
  internacional?: boolean;
  // Cuenta bancaria
  banco?: string;
  numeroCuentaMasked?: string;
  cbuMasked?: string;
  // Cheque certificado
  numeroCheque?: string;
  montoGarantia?: number | null;
  montoDisponible?: number | null;
}

export interface AddPaymentMethodRequest {
  tipo: TipoMedioPago;
  moneda?: Moneda;
  // Tarjeta de crédito
  titular?: string;
  numeroTarjeta?: string; // últimos 4 dígitos
  vencimiento?: string;
  // Cuenta bancaria
  banco?: string;
  numeroCuenta?: string;
  cbu?: string;
  // Cheque certificado
  numeroCheque?: string;
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
  estado: EstadoConsignacion;
  // Campos reales del backend (Consignacion):
  tipoBien?: string;
  descripcion?: string;
  precioBaseOfrecido?: number | null;
  causaRechazo?: string | null;
  fotos?: string[];
  historia?: string;
  declaraPropiedad?: boolean;
  declaraOrigenLicito?: boolean;
  comision?: number | null;
  polizaSeguro?: PolizaSeguro | null;
  gastosDevolucion?: number | null;
  // Opcionales/legacy usados por algunas pantallas:
  nombreBien?: string;
  descripcionDetallada?: string;
  valorBaseOfrecido?: number | null;
  ubicacionDeposito?: string | null;
  subastaAsignadaId?: string | null;
  fechaSubastaAsignada?: string | null;
  motivoRechazo?: string | null;
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
  total?: number;
  estadoPago?: string;
  fechaLimitePago?: string | null;
  retiraPersonalmente?: boolean;
  direccionEnvio?: string | null;
  medioPago?: MedioPago;
  fecha: string;
}

/** Pieza ganada por el usuario (GET /sales/won). */
export interface WonItem {
  ventaId: string;
  piezaId: string;
  subastaId: string;
  descripcion: string;
  imagen?: string | null;
  montoGanador: number;
  moneda: Moneda;
  estadoPago: 'PENDIENTE_PAGO' | 'PAGADO' | 'INCUMPLIDO' | string;
  fechaLimitePago?: string | null;
  vencido?: boolean;
}

/** Detalle de checkout de una pieza ganada (GET /sales/won/{piezaId}/checkout). */
export interface CheckoutDetail {
  ventaId?: string;
  piezaId: string;
  descripcion: string;
  moneda: Moneda;
  precioFinal: number;
  comision: number;
  costoEnvio: number;
  totalEnvio: number;
  totalRetiro: number;
  estadoPago: string;
  fechaLimitePago?: string | null;
}

export interface PayRequest {
  medioPagoId: string;
  retiraPersonalmente: boolean;
  direccionEnvio?: string;
}
