import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { usersApi } from '@/api/services';

export default function EditProfileScreen() {
  const nav = useNavigation();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersApi.me().then((u) => {
      setNombre(u.nombre ?? '');
      setApellido(u.apellido ?? '');
      setDomicilio(u.domicilioLegal ?? '');
      setPais(u.paisOrigen ?? '');
    }).catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      await usersApi.updateMe({ nombre, apellido, domicilioLegal: domicilio, paisOrigen: pais });
      Alert.alert('Listo', 'Datos guardados.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Editar Perfil</Text>
      <TextField label="Nombre" value={nombre} onChangeText={setNombre} />
      <TextField label="Apellido" value={apellido} onChangeText={setApellido} />
      <TextField label="Domicilio Legal" value={domicilio} onChangeText={setDomicilio} />
      <TextField label="País de Origen" value={pais} onChangeText={setPais} />
      <PrimaryButton title="Confirmar Datos" onPress={submit} loading={loading} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 20 },
});
