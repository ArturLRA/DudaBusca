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
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../components/Header'
import { MOCK_PRODUCTS } from '../constants/mockData'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { AnalyzedItem, Product, RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>
type RouteProps = RouteProp<RootStackParamList, 'Report'>

function toProduct(item: AnalyzedItem, index: number): Product {
  return {
    id: item.productId ?? `temp-${index}`,
    name: item.name,
    corredor: 'Corredor 5',
    prateleira: `prateleira ${17 + index}`,
    detectedPrice: item.detectedPrice,
    correctPrice: item.correctPrice ?? undefined,
    hasDivergence: item.hasDivergence,
  }
}

export function ReportScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { analyzedItems, imageUri } = route.params ?? {}

  const initialProducts: Product[] = analyzedItems
    ? analyzedItems.map(toProduct)
    : MOCK_PRODUCTS

  const [products, setProducts] = useState<Product[]>(initialProducts)

  function handleRemove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSubmit() {
    navigation.navigate('Submitted')
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
              <Text style={styles.badgeText}>{divergenceCount} divergência{divergenceCount > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.scroll}>
          {products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <View style={styles.productNameRow}>
                  {product.hasDivergence && (
                    <Ionicons name="alert-circle" size={14} color={COLORS.error} style={styles.alertIcon} />
                  )}
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                </View>
                <Text style={styles.productLocation}>
                  {product.corredor} · {product.prateleira}
                </Text>
                {product.hasDivergence && product.correctPrice != null && (
                  <Text style={styles.priceDiff}>
                    Etiqueta: R$ {product.detectedPrice?.toFixed(2)} · Correto: R$ {product.correctPrice.toFixed(2)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(product.id)}
              >
                <Text style={styles.removeBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          ))}

          {products.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum item no relatório.</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>Enviar relatório</Text>
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
  productLocation: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceDiff: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
    fontWeight: '500',
  },
  removeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  removeBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
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
  submitBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})
