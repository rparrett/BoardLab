import React from 'react';
import { ListItem, makeStyles, Text, useTheme } from '@rn-vui/themed';
import BottomSheetHeader from './BottomSheetHeader';
import SafeBottomSheet from './SafeBottomSheet';
import { AngleStatsData } from '../contexts/DatabaseProvider';
import StarRating from './StarRating';
import { View } from 'react-native';

type AngleOption = {
  label: string;
  value: number;
};

type Props = {
  isVisible: boolean;
  selectedAngle: number;
  onSelect: (option: AngleOption) => void;
  onBackdropPress: () => void;
  angleStats?: Map<number, AngleStatsData>;
  setterAngle?: number | null;
};

export default function AngleSelectBottomSheet({
  isVisible,
  selectedAngle,
  onSelect,
  onBackdropPress,
  angleStats,
  setterAngle,
}: Props) {
  const styles = useStyles();
  const { theme } = useTheme();

  const generateAngleOptions = (
    min: number,
    max: number,
    step: number,
  ): AngleOption[] => {
    const options: AngleOption[] = [];
    for (let angle = min; angle <= max; angle += step) {
      options.push({ label: `${angle}°`, value: angle });
    }
    return options;
  };

  const angleOptions = generateAngleOptions(0, 70, 5);

  return (
    <SafeBottomSheet isVisible={isVisible} onBackdropPress={onBackdropPress}>
      <BottomSheetHeader
        key="title"
        title="Select Angle"
        onClose={onBackdropPress}
      />

      {angleOptions.map(option => {
        const stats = angleStats?.get(option.value);
        const isSetterAngle = setterAngle === option.value;
        const angleLabel = isSetterAngle
          ? `${option.label} (Setter's Angle)`
          : option.label;
        const faDate =
          stats?.fa_at &&
          `on ${new Date(stats.fa_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`;
        const faText =
          stats?.fa_username && `FA: ${stats?.fa_username} ${faDate}`;

        return (
          <ListItem
            key={option.value}
            onPress={() => onSelect(option)}
            bottomDivider
            containerStyle={[
              styles.listItemContainer,
              selectedAngle === option.value &&
                styles.selectedListItemContainer,
            ]}
          >
            <View
              style={[
                styles.selectionIndicator,
                selectedAngle === option.value && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
            <ListItem.Content>
              <View style={styles.mainRow}>
                <View style={styles.leftContent}>
                  <ListItem.Title>{angleLabel}</ListItem.Title>
                  {angleStats && stats && (
                    <>
                      <Text style={[styles.statsText]}>
                        {stats.ascensionist_count || 0} ascensionist
                        {(stats.ascensionist_count || 0) === 1 ? '' : 's'}
                      </Text>
                      <Text style={[styles.statsText]}>{faText}</Text>
                    </>
                  )}
                </View>
                {angleStats && (
                  <View style={styles.rightContent}>
                    {stats ? (
                      <>
                        {stats.grade_name && (
                          <Text style={styles.grade}>{stats.grade_name}</Text>
                        )}
                        {stats.quality_average && (
                          <StarRating
                            rating={stats.quality_average}
                            size={16}
                          />
                        )}
                      </>
                    ) : (
                      <Text style={[styles.projectText]}>Project</Text>
                    )}
                  </View>
                )}
              </View>
            </ListItem.Content>
          </ListItem>
        );
      })}
    </SafeBottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  listItemContainer: {
    backgroundColor: theme.colors.secondarySurface,
    margin: 0,
    paddingVertical: 12,
  },
  selectedListItemContainer: {
    backgroundColor: theme.colors.secondarySurface,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'transparent',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statsText: {
    fontSize: 12,
    marginTop: 4,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  grade: {
    fontSize: 14,
  },
  projectText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
}));
