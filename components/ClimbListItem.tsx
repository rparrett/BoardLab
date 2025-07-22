import React from 'react';
import { TouchableHighlight, View, StyleSheet, Platform } from 'react-native';
import { makeStyles, Text, useTheme } from '@rn-vui/themed';
import { match, P } from 'ts-pattern';
import StarRating from './StarRating';
import { DbClimb } from '../contexts/DatabaseProvider';

type Props = {
  item: DbClimb;
  onPress: () => void;
};

export default function ClimbListItem({ item, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useStyles();

  let subtitle = match(item)
    .with({ fa_username: null }, () => `Set: ${item.setter_username}`)
    .with(
      { fa_username: P.string, setter_username: P.string },
      ({ fa_username, setter_username }) =>
        fa_username === setter_username
          ? `Set & FA: ${item.setter_username}`
          : `Set: ${item.setter_username} FA: ${item.fa_username}`,
    )
    .otherwise(() => null);

  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={theme.colors.grey5}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <Text style={[styles.title]}>{item.name}</Text>
          {subtitle && <Text style={[styles.subtitle]}>{subtitle}</Text>}
          {item.grade_name && (
            <Text style={[styles.subtitle]}>
              {item.ascensionist_count} ascensionist
              {item.ascensionist_count !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={styles.rightColumn}>
          {item.grade_name ? (
            <Text
              style={[
                styles.grade,
                item.benchmark_difficulty !== null ? styles.benchmarkGrade : {},
              ]}
            >
              {item.grade_name}
            </Text>
          ) : (
            <Text style={styles.projectText}>Project</Text>
          )}
          {item.quality_average && item.quality_average > 0 && (
            <StarRating rating={item.quality_average} size={16} />
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
}

const useStyles = makeStyles((theme, _props: Props) => ({
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    padding: Platform.select({ ios: 14, default: 16 }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  rightColumn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  title: {
    fontSize: Platform.select({ ios: 17, default: 16 }),
  },
  subtitle: {
    fontSize: Platform.select({ ios: 15, default: 14 }),
  },
  grade: {
    fontSize: Platform.select({ ios: 15, default: 14 }),
  },
  benchmarkGrade: {
    color: theme.colors.secondary,
  },
  projectText: {
    fontStyle: 'italic',
    opacity: 0.7,
    fontSize: Platform.select({ ios: 15, default: 14 }),
  },
}));
