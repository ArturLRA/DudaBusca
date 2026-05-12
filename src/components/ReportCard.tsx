import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme'
import { Report } from '../types'

interface ReportCardProps {
  report: Report
  onPress: () => void
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imagePlaceholder}>
        {report.imageUri ? (
          <Image source={{ uri: report.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFill} />
        )}
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
