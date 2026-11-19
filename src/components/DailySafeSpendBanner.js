import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SPACING, RADIUS, useAppTheme } from '../constants/theme';
import { formatINR } from '../services/financialCalc';
import TactileTouch from './TactileTouch';

/**
 * DailySafeSpendBanner
 * Built from scratch: Sleek, responsive Daily Safe-to-Spend banner for Home Screen.
 * Displays calculated daily safe spending allowance with tactile micro-interaction.
 */
export default function DailySafeSpendBanner({
  dailySafeSpendPaise,
  daysLeft,
  onPress,
}) {
  const theme = useAppTheme();

  return (
    <TactileTouch
      style={[
        styles.container,
        {
          backgroundColor: theme.safeSpendBg,
          borderColor: theme.safeSpendBorder,
        },
      ]}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <View style={styles.leftCol}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.safeSpendIconBox },
          ]}
        >
          <Feather name="calendar" size={16} color={theme.safeSpendIcon} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.safeSpendTitle }]}>
            DAILY SAFE-TO-SPEND
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.safeSpendSubtitle }]}
            numberOfLines={1}
          >
            {daysLeft} days remaining • Tap for today's breakdown
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.amount, { color: theme.safeSpendAmount }]}>
          {formatINR(dailySafeSpendPaise)}
        </Text>
        <Feather name="chevron-right" size={15} color={theme.safeSpendIcon} />
      </View>
    </TactileTouch>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
