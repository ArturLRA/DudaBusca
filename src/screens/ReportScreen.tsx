import React, { useState } from 'react'
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
import { AnalyzedItem, Product, RootStackParamList } from '../types'
import { api } from '../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>
type RouteProps = RouteProp<RootStackParamList, 'Report'>

const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? ''

function toProduct(item: AnalyzedItem, index: number): Product {
  return {
    id: item.productId ?? `temp-${index}`,
    name: item.name,
    corredor: 'Corredor',
    prateleira: 'Prateleira',
    detectedPrice: item.detectedPrice,
    correctPrice: item.correctPrice ?? undefined,
    hasDivergence: item.hasDivergence,
  }
}

export function ReportScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { analyzedItems, imageUri } = route.params ?? {}

  const [products, setProducts] = useState<Product[]>(
    analyzedItems ? analyzedItems.map(toProduct) : [],
  )
  const [submitting, setSubmitting] = useState(false)

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
          confidence: 95,
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

  const divergenceCount = products.filter((p) => p.hasDivergence).length

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
          {divergenceCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {divergenceCount} divergência{divergenceCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.scroll}>
          {products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <View style={styles.productNameRow}>
                  {product.hasDivergence && (
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={COLORS.error}
                      style={styles.alertIcon}
                    />
                  )}
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                </View>
                {product.hasDivergence && product.correctPrice != null && (
                  <Text style={styles.priceDiff}>
                    Etiqueta: R$ {product.detectedPrice?.toFixed(2)} · Correto: R${' '}
                    {product.correctPrice.toFixed(2)}
                  </Text>
                )}
                {!product.hasDivergence && product.detectedPrice != null && (
                  <Text style={styles.priceOk}>R$ {product.detectedPrice.toFixed(2)} · OK</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(product.id)}
                disabled={submitting}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}

          {products.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Nenhum item no relatório.</Text>
            </View>
          )}
        </ScrollView>

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
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  photoBanner: {
    height: 160,
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
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  listTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 4,
  },
  productName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  priceDiff: {
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
