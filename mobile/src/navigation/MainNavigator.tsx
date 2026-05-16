import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import DiscoverScreen from '@/screens/DiscoverScreen';
import AuctionDetailScreen from '@/screens/AuctionDetailScreen';
import LiveBiddingScreen from '@/screens/LiveBiddingScreen';
import SoldItemDetailScreen from '@/screens/SoldItemDetailScreen';
import AcquisitionScreen from '@/screens/AcquisitionScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import MetricsScreen from '@/screens/MetricsScreen';
import PaymentMethodsScreen from '@/screens/PaymentMethodsScreen';
import AddPaymentMethodScreen from '@/screens/AddPaymentMethodScreen';
import MyConsignmentsScreen from '@/screens/MyConsignmentsScreen';
import ConsignmentFormScreen from '@/screens/ConsignmentFormScreen';
import RequestSentScreen from '@/screens/RequestSentScreen';
import RequestAcceptedScreen from '@/screens/RequestAcceptedScreen';
import RequestRejectedScreen from '@/screens/RequestRejectedScreen';
import PieceLocationScreen from '@/screens/PieceLocationScreen';
import FineDetailScreen from '@/screens/FineDetailScreen';
import { colors } from '@/theme/colors';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandPrimary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.surfaceCream },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Descubrir' }} />
      <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ title: 'Detalle de Subasta' }} />
      <Stack.Screen name="LiveBidding" component={LiveBiddingScreen} options={{ title: 'Participar' }} />
      <Stack.Screen name="SoldItemDetail" component={SoldItemDetailScreen} options={{ title: 'Item Vendido' }} />
      <Stack.Screen name="Acquisition" component={AcquisitionScreen} options={{ title: 'Caso Adquisición' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
      <Stack.Screen name="Metrics" component={MetricsScreen} options={{ title: 'Métricas' }} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Medios de Pago' }} />
      <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} options={{ title: 'Agregar Método' }} />
      <Stack.Screen name="MyConsignments" component={MyConsignmentsScreen} options={{ title: 'Mis Subastas' }} />
      <Stack.Screen name="ConsignmentForm" component={ConsignmentFormScreen} options={{ title: 'Subastar algo propio' }} />
      <Stack.Screen name="RequestSent" component={RequestSentScreen} options={{ title: 'Solicitud Enviada' }} />
      <Stack.Screen name="RequestAccepted" component={RequestAcceptedScreen} options={{ title: 'Solicitud Aceptada' }} />
      <Stack.Screen name="RequestRejected" component={RequestRejectedScreen} options={{ title: 'Solicitud Rechazada' }} />
      <Stack.Screen name="PieceLocation" component={PieceLocationScreen} options={{ title: 'Ubicación de Pieza' }} />
      <Stack.Screen name="FineDetail" component={FineDetailScreen} options={{ title: 'Multa Aplicada' }} />
    </Stack.Navigator>
  );
}
