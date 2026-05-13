import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { Header } from '../components/Header'
import { api } from '../services/api'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { IssueType, ReportSummary } from '../types'

const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? ''

interface IssueConfig {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  bg: string
}

const ISSUE_CONFIG: Record<IssueType, IssueConfig> = {
  correct: {
    label: 'Corretos',
    icon: 'checkmark-circle',
    color: '#388E3C',
    bg: '#E8F5E9',
  },
  wrong_price: {
    label: 'Preço errado',
    icon: 'alert-circle',
    color: '#F44336',
    bg: '#FFEBEE',
  },
  missing_label: {
    label: 'Sem etiqueta',
    icon: 'pricetag-outline',
    color: '#FF9800',
    bg: '#FFF3E0',
  },
  empty_shelf: {
    label: 'Vaga vazia',
    icon: 'remove-circle-outline',
    color: '#607D8B',
    bg: '#ECEFF1',
  },
  damaged_product: {
    label: 'Embalagem danificada',
    icon: 'warning-outline',
    color: '#9C27B0',
    bg: '#F3E5F5',
  },
  wrong_label: {
    label: 'Etiqueta trocada',
    icon: 'swap-horizontal',
    color: '#FF5722',
    bg: '#FBE9E7',
  },
  multiple_labels: {
    label: 'Etiquetas conflitantes',
    icon: 'copy-outline',
    color: '#FFC107',
    bg: '#FFFDE7',
  },
  expired_product: {
    label: 'Produto vencido',
    icon: 'close-circle',
    color: '#B71C1C',
    bg: '#FFCDD2',
  },
  near_expiry: {
    label: 'Vence em breve',
    icon: 'time-outline',
    color: '#E65100',
    bg: '#FFF8E1',
  },
}

const ISSUE_ORDER: IssueType[] = [
  'correct',
  'wrong_price',
  'missing_label',
  'empty_shelf',
  'damaged_product',
  'wrong_label',
  'multiple_labels',
  'expired_product',
  'near_expiry',
]

function percentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardScreen() {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  async function fetchSummary(isRefresh = false) {
    if (!DEMO_USER_ID) {
      setLoading(false)
      return
    }
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(false)
      const data = await api.reports.summary(DEMO_USER_ID)
      setSummary(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchSummary()
    }, []),
  )

  const issueCount = summary
    ? Object.values(summary.byIssue).filter((v) => v > 0).length
    : 0

  const problemCount = summary
    ? summary.totalItems - summary.byIssue.correct
    : 0

  const healthPct = summary && summary.totalItems > 0
    ? Math.round((summary.byIssue.correct / summary.totalItems) * 100)
    : 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header showBack title="Visão Geral" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.placeholder} />
          <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSummary()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSummary(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Header cards */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCard, { flex: 1 }]}>
              <Text style={styles.headerCardValue}>{summary?.totalReports ?? 0}</Text>
              <Text style={styles.headerCardLabel}>Relatórios</Text>
            </View>
            <View style={[styles.headerCard, { flex: 1 }]}>
              <Text style={styles.headerCardValue}>{summary?.totalItems ?? 0}</Text>
              <Text style={styles.headerCardLabel}>Itens auditados</Text>
            </View>
            <View style={[styles.headerCard, styles.healthCard, { flex: 1 }]}>
              <Text style={[styles.headerCardValue, { color: healthPct >= 70 ? COLORS.primary : '#F44336' }]}>
                {healthPct}%
              </Text>
              <Text style={styles.headerCardLabel}>Conformidade</Text>
            </View>
          </View>

          {/* Problems banner */}
          {summary && summary.totalItems > 0 && (
            <View style={[styles.bannerCard, problemCount > 0 ? styles.bannerProblem : styles.bannerOk]}>
              <Ionicons
                name={problemCount > 0 ? 'alert-circle' : 'checkmark-circle'}
                size={22}
                color={problemCount > 0 ? '#F44336' : COLORS.primary}
              />
              <Text style={[styles.bannerText, { color: problemCount > 0 ? '#F44336' : COLORS.primary }]}>
                {problemCount > 0
                  ? `${problemCount} problema${problemCount > 1 ? 's' : ''} encontrado${problemCount > 1 ? 's' : ''} em ${issueCount} categoria${issueCount > 1 ? 's' : ''}`
                  : 'Tudo em conformidade — nenhum problema encontrado'}
              </Text>
            </View>
          )}

          {/* Issue breakdown */}
          <Text style={styles.sectionTitle}>Detalhamento por tipo</Text>

          {summary && summary.totalItems === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Nenhum item auditado ainda.</Text>
              <Text style={styles.emptySubtext}>Crie relatórios para ver a visão geral.</Text>
            </View>
          ) : (
            ISSUE_ORDER.map((issueKey) => {
              const count = summary?.byIssue[issueKey] ?? 0
              const config = ISSUE_CONFIG[issueKey]
              const pct = percentage(count, summary?.totalItems ?? 0)

              return (
                <View key={issueKey} style={styles.issueRow}>
                  <View style={[styles.issueIconBg, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={18} color={config.color} />
                  </View>
                  <View style={styles.issueInfo}>
                    <View style={styles.issueNameRow}>
                      <Text style={styles.issueName}>{config.label}</Text>
                      <Text style={[styles.issueCount, { color: count > 0 && issueKey !== 'correct' ? config.color : COLORS.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                    <View style={styles.issueBarBg}>
                      <View
                        style={[
                          styles.issueBarFill,
                          {
                            width: pct,
                            backgroundColor: count > 0 ? config.color : COLORS.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.issuePct}>{pct}</Text>
                  </View>
                </View>
              )
            })
          )}

          {summary && (
            <Text style={styles.lastUpdated}>
              Atualizado em {formatDate(summary.lastUpdated)}
            </Text>
          )}
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  healthCard: {},
  headerCardValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerCardLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  bannerProblem: {
    backgroundColor: '#FFEBEE',
  },
  bannerOk: {
    backgroundColor: COLORS.primaryLight,
  },
  bannerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.placeholder,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  issueIconBg: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueInfo: {
    flex: 1,
  },
  issueNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  issueCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
  issueBarBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  issueBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  issuePct: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.placeholder,
    marginTop: 2,
    textAlign: 'right',
  },
  lastUpdated: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
})
