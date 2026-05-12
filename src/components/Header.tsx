import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme'
import { RootStackParamList } from '../types'

interface HeaderProps {
  showBack?: boolean
  title?: string
  onUserPress?: () => void
}

export function Header({ showBack = false, title = 'DudaBusca', onUserPress }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}

      <Text style={styles.title}>{title}</Text>

      {!showBack ? (
        <TouchableOpacity
          onPress={onUserPress ?? (() => navigation.navigate('Profile'))}
          style={styles.iconButton}
        >
          <View style={styles.userIconBg}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
