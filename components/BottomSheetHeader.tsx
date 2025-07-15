import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Divider, makeStyles, Icon } from '@rn-vui/themed';

type Props = {
  title: string;
  onClose: () => void;
};

export default function BottomSheetHeader({ title, onClose }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.spacer} />
        <Text style={styles.headerText}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" type="material" size={24} />
        </TouchableOpacity>
      </View>
      <Divider />
    </View>
  );
}

const useStyles = makeStyles(_theme => ({
  headerContainer: {
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  spacer: {
    width: 32, // Same width as close button (24px icon + 8px padding)
  },
  headerText: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
}));
