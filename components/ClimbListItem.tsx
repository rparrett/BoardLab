import React from 'react';
import { TouchableHighlight, View, StyleSheet, Platform } from 'react-native';
import { Icon, makeStyles, Text, useTheme } from '@rneui/themed';
import { DbClimb } from '../Database';
import { match, P } from 'ts-pattern';

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
          : `Set: ${item.setter_username} FA: ${item.setter_username}`,
    )
    .otherwise(() => null);

  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    const stars = [];

    for (let starValue = 1; starValue <= 3; starValue++) {
      let iconName = 'star-o';
      if (roundedRating >= starValue) {
        iconName = 'star';
      } else if (roundedRating >= starValue - 0.5) {
        iconName = 'star-half-empty';
      }

      stars.push(
        <Icon
          key={starValue}
          color={theme.colors.star}
          size={16}
          type="font-awesome"
          name={iconName}
        />,
      );
    }

    return stars;
  };

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
          <Text style={[styles.subtitle]}>
            {item.ascensionist_count} ascensionist
            {item.ascensionist_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.stars}>{renderStars(item.quality_average)}</View>
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
}));
