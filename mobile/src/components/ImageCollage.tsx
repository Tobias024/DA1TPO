import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type Props = {
  images: string[];
  height?: number;
};

const DEFAULT_HEIGHT = 180;

export default function ImageCollage({ images, height = DEFAULT_HEIGHT }: Props) {
  if (images.length === 0) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Ionicons name="image-outline" size={32} color={colors.inputHint} />
      </View>
    );
  }

  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} style={[styles.single, { height }]} resizeMode="cover" />;
  }

  const main = images[0];
  const thumbs = images.slice(1, 5);
  const extra = images.length > 5 ? images.length - 5 : 0;

  return (
    <View style={[styles.grid, { height }]}>
      <Image source={{ uri: main }} style={styles.main} resizeMode="cover" />
      <View style={styles.gridRight}>
        {[0, 1, 2, 3].map((i) => {
          const uri = thumbs[i];
          const isLast = i === 3;
          return (
            <View key={i} style={styles.thumb}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <View style={styles.thumbEmpty}>
                    <MaterialIcons name="image" size={22} color={colors.inputBorder} />
                </View>
              )}
              {isLast && extra > 0 ? (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{extra}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    backgroundColor: colors.inputBg,
    alignItems: 'center', justifyContent: 'center',
  },
  single: { width: '100%' },
  grid: { width: '100%', flexDirection: 'row' },
  main: { width: '55%', height: '100%' },
  gridRight: { width: '45%', flexDirection: 'row', flexWrap: 'wrap' },
  thumb: { width: '50%', height: '50%' },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: colors.inputBg,
    alignItems: 'center', 
    justifyContent: 'center',
},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayText: { color: colors.textOnDark, fontSize: 20, fontWeight: '700' },
});