import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { Header } from '../components/Header'
import { api } from '../services/api'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

interface OptionRowProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  description: string
  onPress: () => void
  disabled?: boolean
}

function OptionRow({ icon, label, description, onPress, disabled }: OptionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, disabled && styles.optionRowDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.optionIconBg}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.placeholder} />
    </TouchableOpacity>
  )
}

export function NewReportScreen() {
  const navigation = useNavigation<Nav>()
  const [loading, setLoading] = useState(false)

  async function handleImageSelected(uri: string) {
    setLoading(true)
    try {
      const result = await api.analyze(uri)
      if (result.items.length === 0) {
        Alert.alert(
          'Nenhum item encontrado',
          'A IA não identificou produtos ou problemas nesta imagem. Tente uma foto mais próxima da gôndola.',
          [{ text: 'OK' }],
        )
        return
      }
      navigation.navigate('Report', { analyzedItems: result.items, imageUri: uri })
    } catch {
      Alert.alert(
        'Erro de conexão',
        'Não foi possível conectar ao servidor de análise. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }],
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para selecionar fotos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (!result.canceled) {
      await handleImageSelected(result.assets[0].uri)
    }
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à câmera para fotografar gôndolas.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 })
    if (!result.canceled) {
      await handleImageSelected(result.assets[0].uri)
    }
  }

  function handleLiveVideo() {
    navigation.navigate('LiveVideo')
  }

  function handleBarcode() {
    navigation.navigate('Barcode')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analisando gôndola...</Text>
            <Text style={styles.loadingSubtext}>Gemini identificando produtos e problemas</Text>
          </View>
        ) : (
          <>
            <OptionRow
              icon="cloud-upload-outline"
              label="Upload de foto"
              description="Selecione uma imagem da galeria"
              onPress={handleUpload}
            />
            <View style={styles.divider} />
            <OptionRow
              icon="camera-outline"
              label="Abrir câmera"
              description="Fotografe a gôndola agora"
              onPress={handleCamera}
            />
            <View style={styles.divider} />
            <OptionRow
              icon="videocam-outline"
              label="Vídeo ao vivo"
              description="Captura automática a cada 4 segundos"
              onPress={handleLiveVideo}
            />
            <View style={styles.divider} />
            <OptionRow
              icon="barcode-outline"
              label="Código de barras"
              description="Leia o EAN para consultar o preço"
              onPress={handleBarcode}
            />
          </>
        )}
      </View>

      {!loading && (
        <TouchableOpacity
          style={styles.cancelFab}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  loadingSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  optionRowDisabled: {
    opacity: 0.4,
  },
  optionIconBg: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xl,
  },
  cancelFab: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
})
