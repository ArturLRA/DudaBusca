import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { Report } from '../types'

interface ReportCardProps {
  report: Report
  onPress: () => void
  onDelete: () => void
}

export function ReportCard({ report, onPress, onDelete }: ReportCardProps) {
  const isSent = report.status === 'sent'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.85}
      delayLongPress={500}
    >
      <View style={styles.imagePlaceholder}>
        {report.imageUri ? (
          <Image source={{ uri: report.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFill} />
        )}

        <View style={[styles.statusBadge, isSent ? styles.statusSent : styles.statusDraft]}>
          <Ionicons
            name={isSent ? 'checkmark-circle' : 'time-outline'}
            size={11}
            color={COLORS.white}
          />
          <Text style={styles.statusText}>{isSent ? 'Enviado' : 'Rascunho'}</Text>
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.location} numberOfLines={1}>
          {report.corredor} · {report.prateleira}
        </Text>
        <Text style={styles.meta}>
          {report.date} · {report.time} · {report.itemCount} itens
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: SPACING.xs,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.cardPlaceholder,
  },
  imagePlaceholder: {
    height: 110,
    backgroundColor: COLORS.cardPlaceholder,
  },
  imageFill: {
    flex: 1,
    backgroundColor: COLORS.cardPlaceholder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusSent: {
    backgroundColor: COLORS.primary,
  },
  statusDraft: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  infoBar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  location: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  meta: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
    opacity: 0.9,
  },
})
