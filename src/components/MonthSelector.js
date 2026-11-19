import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';
import { getMonthName } from '../services/financialCalc';

export default function MonthSelector({ currentMonthKey, onSelectMonth }) {
  const theme = useAppTheme();
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const handlePrev = () => {
    let prevM = month - 1;
    let prevY = year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    const key = `${prevY}-${String(prevM).padStart(2, '0')}`;
    onSelectMonth(key);
  };

  const handleNext = () => {
    let nextM = month + 1;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const key = `${nextY}-${String(nextM).padStart(2, '0')}`;
    onSelectMonth(key);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.monthSelectorBg,
          borderColor: theme.monthSelectorBorder,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.arrowButton, { backgroundColor: theme.arrowBtnBg }]}
        onPress={handlePrev}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={20} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Feather name="calendar" size={15} color={theme.monthSelectorIcon} />
        <Text style={[styles.monthText, { color: theme.monthSelectorText }]}>
          {getMonthName(currentMonthKey)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.arrowButton, { backgroundColor: theme.arrowBtnBg }]}
        onPress={handleNext}
        activeOpacity={0.7}
      >
        <Feather name="chevron-right" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
