import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../components/Header'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { AnalyzedItem, IssueType, Product, RootStackParamList } from '../types'
import { api } from '../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>
type RouteProps = RouteProp<RootStackParamList, 'Report'>

const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? ''

interface IssueBadgeConfig {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  bg: string
}

const ISSUE_BADGE: Record<IssueType, IssueBadgeConfig> = {
  correct: { label: 'OK', icon: 'checkmark-circle', color: '#388E3C', bg: '#E8F5E9' },
  wrong_price: { label: 'Preço errado', icon: 'alert-circle', color: '#F44336', bg: '#FFEBEE' },
  missing_label: { label: 'Sem etiqueta', icon: 'pricetag-outline', color: '#FF9800', bg: '#FFF3E0' },
  empty_shelf: { label: 'Vaga vazia', icon: 'remove-circle-outline', color: '#607D8B', bg: '#ECEFF1' },
  damaged_product: { label: 'Danificado', icon: 'warning-outline', color: '#9C27B0', bg: '#F3E5F5' },
  wrong_label: { label: 'Etiq. trocada', icon: 'swap-horizontal', color: '#FF5722', bg: '#FBE9E7' },
  multiple_labels: { label: 'Multi-etiqueta', icon: 'copy-outline', color: '#F9A825', bg: '#FFFDE7' },
  expired_product: { label: 'Vencido', icon: 'close-circle', color: '#B71C1C', bg: '#FFCDD2' },
  near_expiry: { label: 'Vence em breve', icon: 'time-outline', color: '#E65100', bg: '#FFF8E1' },
}

function toProduct(item: AnalyzedItem, index: number): Product {
  return {
    id: item.productId ?? `temp-${index}`,
    name: item.name,
    corredor: 'Corredor',
    prateleira: 'Prateleira',
    detectedPrice: item.detectedPrice,
    correctPrice: item.correctPrice ?? undefined,
    hasDivergence: item.hasDivergence,
    issueType: item.issueType,
    confidence: item.confidence,
    dataVencimento: item.dataVencimento,
  }
}

export function ReportScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { reportId, analyzedItems, imageUri } = route.params ?? {}

  const isViewMode = !!reportId && !analyzedItems

  const [products, setProducts] = useState<Product[]>(
    analyzedItems ? analyzedItems.map(toProduct) : [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [loadingReport, setLoadingReport] = useState(isViewMode)

  useEffect(() => {
    if (!isViewMode) return
    async function load() {
      try {
        const data = await api.reports.get(reportId!)
        const items = (data.items as any[]).map((item, i): Product => ({
          id: item.id ?? `item-${i}`,
          name: item.name ?? 'Produto',
          corredor: 'Corredor',
          prateleira: 'Prateleira',
          detectedPrice: item.detectedPrice != null ? parseFloat(item.detectedPrice) : null,
          correctPrice: item.correctPrice != null ? parseFloat(item.correctPrice) : undefined,
          issueType: item.issueType ?? 'correct',
          confidence: item.confidence ?? undefined,
          dataVencimento: item.dataVencimento ?? undefined,
        }))
        setProducts(items)
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar o relatório.')
      } finally {
        setLoadingReport(false)
      }
    }
    load()
  }, [reportId])

  function handleRemove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleSubmit() {
    if (products.length === 0) {
      Alert.alert('Relatório vazio', 'Adicione ao menos um item antes de enviar.')
      return
    }

    setSubmitting(true)
    try {
      const report = await api.reports.create({
        userId: DEMO_USER_ID,
        items: products.map((p) => ({
          productId: p.id.startsWith('temp-') ? undefined : p.id,
          name: p.name,
          detectedPrice: String(p.detectedPrice ?? 0),
          correctPrice: p.correctPrice != null ? String(p.correctPrice) : undefined,
          confidence: p.confidence ?? 95,
          issueType: p.issueType ?? 'correct',
          dataVencimento: p.dataVencimento,
        })),
      })

      await api.reports.submit(report.id)

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } catch {
      Alert.alert('Erro ao enviar', 'Não foi possível salvar o relatório. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const problemCount = products.filter((p) => p.issueType !== 'correct').length
  const correctCount = products.filter((p) => p.issueType === 'correct').length

  if (loadingReport) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header />

      <View style={styles.photoBanner}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photoImage} resizeMode="cover" />
        ) : (
          <Text style={styles.photoLabel}>FOTO DA GÔNDOLA</Text>
        )}
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Relatório</Text>
          <View style={styles.badgeRow}>
            {correctCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#388E3C" />
                <Text style={[styles.badgeText, { color: '#388E3C' }]}>{correctCount} OK</Text>
              </View>
            )}
            {problemCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="alert-circle" size={12} color={COLORS.error} />
                <Text style={[styles.badgeText, { color: COLORS.error }]}>
                  {problemCount} problema{problemCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.scroll}>
          {products.map((product) => {
            const issue = product.issueType ?? 'correct'
            const config = ISSUE_BADGE[issue]

            return (
              <View key={product.id} style={styles.productRow}>
                <View style={[styles.issueIndicator, { backgroundColor: config.color }]} />
                <View style={styles.productInfo}>
                  <View style={styles.productNameRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <View style={[styles.issueBadge, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon} size={11} color={config.color} />
                      <Text style={[styles.issueBadgeText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  </View>

                  {issue === 'wrong_price' && product.correctPrice != null && (
                    <Text style={styles.priceDetail}>
                      Etiqueta: R$ {(product.detectedPrice ?? 0).toFixed(2)} · Correto: R$ {product.correctPrice.toFixed(2)}
                    </Text>
                  )}
                  {issue === 'correct' && product.detectedPrice != null && (
                    <Text style={styles.priceOk}>
                      R$ {(product.detectedPrice).toFixed(2)}
                    </Text>
                  )}
                  {(issue === 'expired_product' || issue === 'near_expiry') && product.dataVencimento && (
                    <Text style={[styles.priceDetail, { color: config.color }]}>
                      Vencimento: {product.dataVencimento}
                    </Text>
                  )}
                  {issue === 'missing_label' && (
                    <Text style={[styles.priceDetail, { color: config.color }]}>
                      Nenhuma etiqueta de preço visível
                    </Text>
                  )}
                  {issue === 'empty_shelf' && (
                    <Text style={[styles.priceDetail, { color: config.color }]}>
                      Espaço vazio na gôndola
                    </Text>
                  )}
                </View>
                {!isViewMode && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(product.id)}
                    disabled={submitting}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
            )
          })}

          {products.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Nenhum item no relatório.</Text>
            </View>
          )}
        </ScrollView>

        {!isViewMode && (
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>Enviar relatório</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBanner: {
    height: 140,
    backgroundColor: COLORS.cardPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 3,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  issueIndicator: {
    width: 3,
    alignSelf: 'stretch',
  },
  productInfo: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.xs,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  productName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
    flexShrink: 0,
  },
  issueBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
    fontWeight: '500',
  },
  priceOk: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: COLORS.error,
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  emptyState: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  submitBtn: {
    margin: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})
