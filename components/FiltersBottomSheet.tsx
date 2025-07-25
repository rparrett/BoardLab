import React from 'react';
import { View, TouchableOpacity, Switch } from 'react-native';
import { makeStyles, Text } from '@rn-vui/themed';
import { useAsync } from 'react-async-hook';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAppState } from '../stores/AppState';
import BottomSheetHeader from './BottomSheetHeader';
import SafeBottomSheet from './SafeBottomSheet';
import Loading from './Loading';
import Error from './Error';

interface FiltersBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
}

export default function FiltersBottomSheet({
  isVisible,
  onBackdropPress,
}: FiltersBottomSheetProps) {
  const { getAvailableGrades, ready } = useDatabase();
  const { climbFilters, setGrades, setSetAtCurrentAngle, setDiscoveryMode } =
    useAppState();
  const styles = useStyles();

  const asyncGrades = useAsync(() => {
    return getAvailableGrades();
  }, [ready]);

  const handleGradeToggle = (difficulty: number) => {
    const currentGrades = climbFilters.grades || [];
    const newGrades = currentGrades.includes(difficulty)
      ? currentGrades.filter(g => g !== difficulty)
      : [...currentGrades, difficulty];
    setGrades(newGrades);
  };

  const handleClearAll = () => {
    setGrades([]);
  };

  const handleSelectAll = () => {
    if (asyncGrades.result) {
      setGrades(asyncGrades.result.map(grade => grade.difficulty));
    }
  };

  return (
    <SafeBottomSheet isVisible={isVisible} onBackdropPress={onBackdropPress}>
      <BottomSheetHeader title="Filters" onClose={onBackdropPress} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grades</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.actionButton}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.actionButton}>Select All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {asyncGrades.loading && <Loading text="Loading grades..." />}
        {asyncGrades.error && <Error error={asyncGrades.error} />}

        {asyncGrades.result && (
          <View style={styles.gradeGrid}>
            {asyncGrades.result.map(grade => (
              <TouchableOpacity
                key={grade.difficulty}
                style={[
                  styles.gradeChip,
                  (climbFilters.grades || []).includes(grade.difficulty) &&
                    styles.gradeChipSelected,
                ]}
                onPress={() => handleGradeToggle(grade.difficulty)}
              >
                <Text
                  style={[
                    styles.gradeChipText,
                    (climbFilters.grades || []).includes(grade.difficulty) &&
                      styles.gradeChipTextSelected,
                  ]}
                >
                  {grade.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Setter Angle</Text>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Set at current angle (±5°)</Text>
          <Switch
            value={climbFilters.setAtCurrentAngle}
            onValueChange={setSetAtCurrentAngle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discovery Mode</Text>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Lesser known climbs by great setters
          </Text>
          <Switch
            value={climbFilters.discoveryMode}
            onValueChange={setDiscoveryMode}
          />
        </View>
      </View>
    </SafeBottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    padding: 16,
    backgroundColor: theme.colors.secondarySurface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.grey5,
    borderWidth: 1,
    borderColor: theme.colors.grey4,
  },
  gradeChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  gradeChipText: {
    fontSize: 14,
    color: theme.colors.grey1,
  },
  gradeChipTextSelected: {
    color: theme.colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.grey1,
  },
}));
