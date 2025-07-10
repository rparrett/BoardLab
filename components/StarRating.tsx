import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, useTheme } from '@rneui/themed';

type Props = {
  rating: number;
  size?: number;
};

export default function StarRating({ rating, size = 16 }: Props) {
  const { theme } = useTheme();

  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  const stars = [];

  for (let i = 0; i < 3; i++) {
    const starValue = i + 1;
    let iconName = 'star-o';

    if (roundedRating >= starValue) {
      iconName = 'star';
    } else if (roundedRating >= starValue - 0.5) {
      iconName = 'star-half-empty';
    }

    stars.push(
      <Icon
        key={i}
        color={theme.colors.star}
        size={size}
        type="font-awesome"
        name={iconName}
      />,
    );
  }

  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 1,
  },
});
