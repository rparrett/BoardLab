import React from 'react';
import { View, Text } from 'react-native';
import { makeStyles } from '@rn-vui/themed';
import { DbClimb } from '../contexts/DatabaseProvider';
import BottomSheetHeader from './BottomSheetHeader';
import SafeBottomSheet from './SafeBottomSheet';

interface ClimbInfoBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  climb: DbClimb;
  currentAngle: number;
}

export default function ClimbInfoBottomSheet({
  isVisible,
  onBackdropPress,
  climb,
  currentAngle,
}: ClimbInfoBottomSheetProps) {
  const styles = useStyles();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeBottomSheet isVisible={isVisible} onBackdropPress={onBackdropPress}>
      <BottomSheetHeader title="Climb Info" onClose={onBackdropPress} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>
          {climb.description || 'No description available'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{formatDate(climb.created_at)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Setter's Angle:</Text>
          <Text style={styles.value}>
            {climb.angle !== null ? `${climb.angle}°` : 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Ascents:</Text>
          <Text style={styles.value}>
            {(climb.total_ascensionist_count || 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Ascents at {currentAngle}°:</Text>
          <Text style={styles.value}>
            {(climb.ascensionist_count || 0).toLocaleString()}
          </Text>
        </View>
        {climb.fa_username && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>First Ascent:</Text>
            <Text style={styles.value}>
              {climb.fa_username}
              {climb.fa_at ? ` on ${formatDate(climb.fa_at)}` : ''}
            </Text>
          </View>
        )}
      </View>
    </SafeBottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    padding: 16,
    backgroundColor: theme.colors.secondarySurface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.primary,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.grey1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.grey1,
  },
  value: {
    fontSize: 16,
    color: theme.colors.grey1,
  },
}));
