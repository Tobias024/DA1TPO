import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, categoriaColor, categoriaTextColor  } from '@/theme/colors';
import { useSession } from '@/storage/SessionContext';

type Props = {
  title: string;
  subtitle?: string;
};

export default function ScreenHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const categoria = user?.categoria;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 16 }]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {categoria ? (
          <View style={[styles.badge, { backgroundColor: categoriaColor(categoria), borderColor: categoriaTextColor(categoria) }]}>
            <MaterialIcons name="workspace-premium" size={13} color={categoriaTextColor(categoria)} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: categoriaTextColor(categoria) }]}>MIEMBRO {categoria}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.brandPrimary,
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 8,
  },
  subtitle: {
    color: colors.inputHint,
    fontSize: 14,
    marginTop: 4,
  },
  badge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    color: colors.textOnDark,
    fontSize: 11,
    fontWeight: '700',
  },
});