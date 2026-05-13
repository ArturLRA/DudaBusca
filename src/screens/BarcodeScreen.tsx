import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../components/Header'
import { api } from '../services/api'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { BarcodeProduct } from '../types'

export function BarcodeScreen() {
  const navigation = useNavigation()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BarcodeProduct | null>(null)
  const [lastEan, setLastEan] = useState<string>('')

  async function handleBarcode({ data }: { data: string }) {
    if (scanned || loading) return
    setScanned(true)
    setLastEan(data)
    setLoading(true)
    try {
      const product = await api.products.barcode(data)
      setResult(product)
    } catch {
      Alert.alert(
        'Produto não encontrado',
        `EAN ${data} não está no cadastro da loja.`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
      )
    } finally {
      setLoading(false)
    }
  }

  function handleNewScan() {
    setScanned(false)
    setResult(null)
    setLastEan('')
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header showBack title="Código de Barras" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header showBack title="Código de Barras" />
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={56} color={COLORS.placeholder} />
          <Text style={styles.permissionText}>Câmera necessária para ler código de barras</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir acesso à câmera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header showBack title="Código de Barras" />

      {result ? (
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View style={styles.resultIconRow}>
              <View style={styles.resultIconBg}>
                <Ionicons name="barcode-outline" size={32} color={COLORS.primary} />
              </View>
            </View>

            <Text style={styles.resultEan}>{lastEan}</Text>
            <Text style={styles.resultName}>{result.name}</Text>

            {result.brand && (
              <Text style={styles.resultBrand}>{result.brand}</Text>
            )}

            {result.category && (
              <Text style={styles.resultCategory}>{result.category}</Text>
            )}

            <View style={styles.priceBadge}>
              {result.price !== null ? (
                <>
                  <Text style={styles.priceLabel}>Preço cadastrado</Text>
                  <Text style={styles.priceValue}>R$ {result.price.toFixed(2)}</Text>
                </>
              ) : (
                <Text style={styles.priceUnavailable}>Preço não cadastrado</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.newScanBtn} onPress={handleNewScan} activeOpacity={0.85}>
            <Ionicons name="scan-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.newScanBtnText}>Nova leitura</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcode}
          />

          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.white} />
              ) : (
                <Text style={styles.scanHint}>Aponte para o código de barras do produto</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const FRAME_SIZE = 240
const CORNER_SIZE = 24
const CORNER_THICK = 3

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  permissionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  permissionBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
  },
  permissionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  scanHint: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: SPACING.sm,
  },
  resultIconRow: {
    marginBottom: SPACING.sm,
  },
  resultIconBg: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultEan: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.placeholder,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  resultName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  resultBrand: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  resultCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  priceLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  priceUnavailable: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  newScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
  },
  newScanBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
})
