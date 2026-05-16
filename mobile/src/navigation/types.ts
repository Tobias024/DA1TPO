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
  RegisterStep2: { registrationId?: string } | undefined;
  RegisterStep3: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Auctions: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Discover: undefined;
  AuctionDetail: { auctionId: string };
  LiveBidding: { auctionId: string };
  SoldItemDetail: { auctionId: string; pieceId?: string };
  Acquisition: { saleId: string };
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
