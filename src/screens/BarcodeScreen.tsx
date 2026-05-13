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
  Image,
  ScrollView,
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
        `EAN ${data} não foi localizado no sistema nem na base global de produtos.`,
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
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product image */}
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={48} color={COLORS.placeholder} />
            </View>
          )}

          {/* Source badge */}
          <View style={[
            styles.sourceBadge,
            result.source === 'local' ? styles.sourceBadgeLocal : styles.sourceBadgeOff,
          ]}>
            <Ionicons
              name={result.source === 'local' ? 'checkmark-circle' : 'globe-outline'}
              size={13}
              color={result.source === 'local' ? COLORS.primary : '#1565C0'}
            />
            <Text style={[
              styles.sourceBadgeText,
              { color: result.source === 'local' ? COLORS.primary : '#1565C0' },
            ]}>
              {result.source === 'local' ? 'Cadastrado na loja' : 'Open Food Facts'}
            </Text>
          </View>

          {/* Main card */}
          <View style={styles.resultCard}>
            <Text style={styles.resultEan}>{lastEan}</Text>
            <Text style={styles.resultName}>{result.name}</Text>

            <View style={styles.detailsRow}>
              {result.brand && (
                <View style={styles.detailChip}>
                  <Ionicons name="business-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.detailChipText}>{result.brand}</Text>
                </View>
              )}
              {result.category && (
                <View style={styles.detailChip}>
                  <Ionicons name="pricetag-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.detailChipText} numberOfLines={1}>{result.category}</Text>
                </View>
              )}
              {result.quantity && (
                <View style={styles.detailChip}>
                  <Ionicons name="scale-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.detailChipText}>{result.quantity}</Text>
                </View>
              )}
            </View>

            {/* Price box */}
            <View style={[
              styles.priceBox,
              !result.inLocalCatalog && styles.priceBoxWarning,
            ]}>
              {result.inLocalCatalog && result.price !== null ? (
                <>
                  <Text style={styles.priceLabel}>Preço cadastrado</Text>
                  <Text style={styles.priceValue}>R$ {result.price.toFixed(2)}</Text>
                </>
              ) : result.inLocalCatalog && result.price === null ? (
                <>
                  <Ionicons name="warning-outline" size={18} color="#E65100" />
                  <Text style={[styles.priceLabel, { color: '#E65100' }]}>Sem preço cadastrado</Text>
                  <Text style={styles.priceSubtext}>Produto encontrado, mas sem preço na loja</Text>
                </>
              ) : (
                <>
                  <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
                  <Text style={[styles.priceLabel, { color: '#1565C0' }]}>Fora do catálogo da loja</Text>
                  <Text style={styles.priceSubtext}>Produto identificado pela base global mas não cadastrado aqui</Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.newScanBtn} onPress={handleNewScan} activeOpacity={0.85}>
            <Ionicons name="scan-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.newScanBtnText}>Nova leitura</Text>
          </TouchableOpacity>
        </ScrollView>
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
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },
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
  resultScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  resultContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  productImage: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  sourceBadgeLocal: {
    backgroundColor: COLORS.primaryLight,
  },
  sourceBadgeOff: {
    backgroundColor: '#E3F2FD',
  },
  sourceBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    gap: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  resultEan: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.placeholder,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  resultName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  detailChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    maxWidth: 120,
  },
  priceBox: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  priceBoxWarning: {
    backgroundColor: '#E3F2FD',
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
  },
  priceSubtext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  newScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    width: '100%',
  },
  newScanBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
})
