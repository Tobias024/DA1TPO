import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, categoriaColor } from '@/theme/colors';
import { useSession } from '@/storage/SessionContext';
import { usersApi } from '@/api/services';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const MENU = [
  { key: 'EditProfile' as const, icon: '✏', label: 'Editar Perfil' },
  { key: 'Metrics' as const, icon: '📊', label: 'Métricas' },
  { key: 'MyConsignments' as const, icon: '🏛', label: 'Mis Subastas' },
  { key: 'PaymentMethods' as const, icon: '💳', label: 'Medios de Pago' },
] as const;

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, signOut, refreshUser } = useSession();

  useEffect(() => {
    usersApi.me().then(refreshUser).catch(() => {});
  }, [refreshUser]);

  const logout = async () => {
    await signOut();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      {/* Banner bordó */}
      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(user?.nombre ?? 'S').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user ? `${user.nombre} ${user.apellido ?? ''}`.trim() : '—'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
        {user?.categoria ? (
          <View style={[styles.catBadge, { backgroundColor: categoriaColor(user.categoria) }]}>
            <Text style={styles.catBadgeText}>{user.categoria}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 16 }}>
        {MENU.map((m) => (
          <Card key={m.key} onPress={() => nav.navigate(m.key)} style={styles.menuItem}>
            <View style={styles.menuRow}>
              <Text style={styles.menuIcon}>{m.icon}</Text>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </Card>
        ))}

        <PrimaryButton
          title="Cerrar sesión"
          variant="outlined"
          onPress={logout}
          style={{ marginTop: 16, borderColor: colors.redLive }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brandPrimary,
    paddingTop: 56,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: colors.brandPrimary, fontSize: 40, fontWeight: '700' },
  userName: { color: colors.textOnDark, fontSize: 22, fontWeight: '700', marginTop: 12 },
  userEmail: { color: colors.onPrimary, fontSize: 14, marginTop: 4 },
  catBadge: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, marginTop: 12,
  },
  catBadgeText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },

  menuItem: { marginBottom: 10, padding: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: colors.textPrimary },
  menuArrow: { color: colors.inputHint, fontSize: 22 },
});
