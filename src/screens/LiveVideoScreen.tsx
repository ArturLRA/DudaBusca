import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { api } from '../services/api'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { RootStackParamList, AnalyzedItem } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CAPTURE_INTERVAL_MS = 4000

export function LiveVideoScreen() {
  const navigation = useNavigation<Nav>()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedItems, setDetectedItems] = useState<AnalyzedItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzing || !cameraRef.current) return
    setIsAnalyzing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false })
      if (!photo) return
      const result = await api.analyze(photo.uri)
      if (result.items.length > 0) {
        setDetectedItems((prev) => mergeItems(prev, result.items))
      }
    } catch {
      // silently skip failed frames
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, captureAndAnalyze])

  function handleConfirm() {
    navigation.navigate('Report', { analyzedItems: detectedItems })
  }

  if (!permission) {
    return <View style={styles.centered} />
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.centered}>
          <Ionicons name="videocam-off-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>Permissão de câmera necessária</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir câmera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={[styles.statusBadge, isRunning ? styles.statusActive : styles.statusIdle]}>
              <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
              <Text style={styles.statusText}>{isRunning ? 'Analisando...' : 'Pausado'}</Text>
            </View>
            {isAnalyzing && (
              <View style={styles.analyzingBadge}>
                <Text style={styles.analyzingText}>IA processando</Text>
              </View>
            )}
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
      </CameraView>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            Produtos detectados{' '}
            {detectedItems.length > 0 && (
              <Text style={styles.panelCount}>({detectedItems.length})</Text>
            )}
          </Text>
          {detectedItems.length > 0 && (
            <TouchableOpacity onPress={() => setDetectedItems([])}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {detectedItems.length === 0 ? (
          <Text style={styles.emptyText}>
            {isRunning
              ? 'Aponte para uma gôndola com etiquetas de preço'
              : 'Toque em Iniciar para começar a análise'}
          </Text>
        ) : (
          <FlatList
            data={detectedItems}
            keyExtractor={(_, i) => String(i)}
            style={styles.itemList}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                {item.hasDivergence && (
                  <Ionicons name="alert-circle" size={16} color={COLORS.error ?? '#e53935'} style={styles.alertIcon} />
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  {item.hasDivergence && (
                    <Text style={styles.itemPrice}>
                      Etiqueta: R$ {item.detectedPrice.toFixed(2)} · Correto: R$ {item.correctPrice?.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            )}
          />
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.controlBtn, isRunning ? styles.stopBtn : styles.startBtn]}
            onPress={() => setIsRunning((r) => !r)}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.controlBtnText}>{isRunning ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>

          {detectedItems.length > 0 && (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirmar ({detectedItems.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

function mergeItems(existing: AnalyzedItem[], incoming: AnalyzedItem[]): AnalyzedItem[] {
  const map = new Map<string, AnalyzedItem>()
  for (const item of existing) map.set(item.name.toLowerCase(), item)
  for (const item of incoming) map.set(item.name.toLowerCase(), item)
  return Array.from(map.values())
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  statusActive: { backgroundColor: 'rgba(76,175,80,0.85)' },
  statusIdle: { backgroundColor: 'rgba(0,0,0,0.5)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#aaa' },
  statusDotActive: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '600' },
  analyzingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,193,7,0.85)',
  },
  analyzingText: { color: '#000', fontSize: FONT_SIZE.xs, fontWeight: '600' },
  scanFrame: {
    alignSelf: 'center',
    width: '85%',
    aspectRatio: 1.6,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  panel: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '45%',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  panelTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  panelCount: { color: COLORS.primary, fontWeight: '700' },
  clearText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  itemList: { maxHeight: 120, marginBottom: SPACING.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alertIcon: { marginRight: 6 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500' },
  itemPrice: { fontSize: FONT_SIZE.xs, color: '#e53935', marginTop: 2 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full ?? 999,
    gap: 6,
  },
  startBtn: { backgroundColor: COLORS.primary },
  stopBtn: { backgroundColor: '#757575' },
  controlBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full ?? 999,
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  permissionText: { fontSize: FONT_SIZE.md, color: COLORS.text, textAlign: 'center' },
  permissionBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full ?? 999,
  },
  permissionBtnText: { color: COLORS.white, fontWeight: '700' },
})
