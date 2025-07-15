import React from 'react';
import { BottomSheet, ListItem, makeStyles } from '@rn-vui/themed';
import BottomSheetHeader from './BottomSheetHeader';

type AngleOption = {
  label: string;
  value: number;
};

type Props = {
  isVisible: boolean;
  selectedAngle: number;
  onSelect: (option: AngleOption) => void;
  onBackdropPress: () => void;
};

export default function AngleSelectBottomSheet({
  isVisible,
  selectedAngle,
  onSelect,
  onBackdropPress,
}: Props) {
  const styles = useStyles();

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
    <BottomSheet
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      scrollViewProps={{ style: styles.container }}
    >
      <BottomSheetHeader
        key="title"
        title="Select Angle"
        onClose={onBackdropPress}
      />

      {angleOptions.map(option => (
        <ListItem
          key={option.value}
          onPress={() => onSelect(option)}
          bottomDivider
          containerStyle={styles.listItemContainer}
        >
          <ListItem.Content>
            <ListItem.Title>{option.label}</ListItem.Title>
          </ListItem.Content>
          {selectedAngle === option.value && (
            <ListItem.CheckBox
              checked
              containerStyle={styles.listItemCheckboxContainer}
            />
          )}
        </ListItem>
      ))}
    </BottomSheet>
  );
}

const useStyles = makeStyles((theme, _props: Props) => ({
  container: {
    backgroundColor: theme.colors.secondarySurface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  listItemContainer: {
    backgroundColor: theme.colors.secondarySurface,
    margin: 0,
    paddingVertical: 8,
  },
  listItemCheckboxContainer: {
    backgroundColor: 'none',
  },
}));
