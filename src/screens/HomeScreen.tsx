import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Header } from '../components/Header'
import { ReportCard } from '../components/ReportCard'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { Report, RootStackParamList } from '../types'
import { api } from '../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [apiError, setApiError] = useState(false)

  async function fetchReports(isRefresh = false) {
    if (!DEMO_USER_ID) {
      setLoading(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setApiError(false)
      const data = await api.reports.list(DEMO_USER_ID)

      const transformed: Report[] = data.map((r: any) => ({
        id: r.id,
        corredor: r.corredor ?? 'Corredor',
        prateleira: r.prateleira ?? 'Prateleira',
        date: formatDate(r.startedAt),
        time: formatTime(r.startedAt),
        itemCount: r.itemCount ?? 0,
        imageUri: r.imageUrl ?? undefined,
        status: r.status === 'completed' ? 'sent' : 'draft',
      }))

      setReports(transformed)
    } catch {
      setApiError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchReports()
    }, []),
  )

  const onRefresh = () => fetchReports(true)

  function handleDeleteReport(report: Report) {
    Alert.alert(
      'Excluir relatório',
      `Excluir o relatório de ${report.corredor} · ${report.prateleira}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setReports((prev) => prev.filter((r) => r.id !== report.id))
            try {
              await api.reports.delete(report.id)
            } catch {
              setReports((prev) => [...prev, report])
              Alert.alert('Erro', 'Não foi possível excluir o relatório. Tente novamente.')
            }
          },
        },
      ],
    )
  }

  const rows: Report[][] = []
  for (let i = 0; i < reports.length; i += 2) {
    rows.push(reports.slice(i, i + 2))
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.sectionTitle}>Meus relatórios</Text>

          {apiError ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Sem conexão com o servidor.</Text>
              <Text style={styles.emptySubtext}>Verifique a URL da API e tente novamente.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Nenhum relatório ainda.</Text>
              <Text style={styles.emptySubtext}>Toque em + para criar o primeiro.</Text>
            </View>
          ) : (
            rows.map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onPress={() => navigation.navigate('Report', { reportId: report.id })}
                    onDelete={() => handleDeleteReport(report)}
                  />
                ))}
                {row.length === 1 && <View style={styles.emptyCell} />}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewReport')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
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
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  emptyCell: {
    flex: 1,
    margin: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.placeholder,
  },
  retryBtn: {
    marginTop: SPACING.md,
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
  fab: {
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
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
})
