/**
 * Tipos de las rutas del navegador.
 * Mantiene un único lugar donde declarar params para todas las pantallas.
 */

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  RegisterStep1: undefined;
  RegisterWaiting: { registrationId: string; registrationToken?: string };
  RegisterStep2: { registrationId?: string; registrationToken?: string } | undefined;
  RegisterStep3: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Auctions: { initialFilter?: string; initialCat?: string } | undefined;
  NuevaSolicitud: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  AuctionDetail: { auctionId: string };
  ItemDetail: { auctionId: string; pieceId: string };
  LiveBidding: { auctionId: string; pieceId?: string };
  SoldItemDetail: { auctionId: string; pieceId?: string };
  WonItems: undefined;
  Acquisition: { saleId?: string; piezaId?: string };
  EditProfile: undefined;
  Metrics: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  MyConsignments: undefined;
  ConsignmentForm: undefined;
  RequestSent: undefined;
  RequestAccepted: { consignmentId: string };
  RequestRejected: { consignmentId: string };
  PieceLocation: { consignmentId: string };
  FineDetail: { titulo: string; mensaje: string };
};
