import React from 'react';
import { View, Share, Alert, Linking } from 'react-native';
import { ListItem, makeStyles, Icon, useTheme } from '@rn-vui/themed';
import QRCodeStyled from 'react-native-qrcode-styled';
import BottomSheetHeader from './BottomSheetHeader';
import SafeBottomSheet from './SafeBottomSheet';

interface ShareBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  climbUuid: string;
}

export default function ShareBottomSheet({
  isVisible,
  onBackdropPress,
  climbUuid,
}: ShareBottomSheetProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  const climbUrl = `https://kilterboardapp.com/climbs/${climbUuid}`;

  const handleShare = async () => {
    try {
      const result = await Share.share({
        url: climbUrl,
      });

      if (result.action === Share.sharedAction) {
        onBackdropPress();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleOpenInKilterBoard = async () => {
    try {
      const supported = await Linking.canOpenURL(climbUrl);
      if (supported) {
        await Linking.openURL(climbUrl);
        onBackdropPress();
      } else {
        Alert.alert('Error', 'Cannot open URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  return (
    <SafeBottomSheet isVisible={isVisible} onBackdropPress={onBackdropPress}>
      <BottomSheetHeader title="Share Climb" onClose={onBackdropPress} />

      <ListItem
        onPress={handleShare}
        bottomDivider
        containerStyle={styles.listItemContainer}
      >
        <Icon name="share" type="material" size={24} />
        <ListItem.Content>
          <ListItem.Title>Share</ListItem.Title>
        </ListItem.Content>
      </ListItem>

      <ListItem
        onPress={handleOpenInKilterBoard}
        bottomDivider
        containerStyle={styles.listItemContainer}
      >
        <Icon name="open-in-new" type="material" size={24} />
        <ListItem.Content>
          <ListItem.Title>Open in KilterBoard</ListItem.Title>
        </ListItem.Content>
      </ListItem>

      <View style={styles.qrCodeContainer}>
        <QRCodeStyled
          data={climbUrl}
          style={styles.qrCode}
          pieceSize={8}
          pieceBorderRadius={2}
          isPiecesGlued={true}
          pieceLiquidRadius={2}
          color={theme.colors.black}
        />
      </View>
    </SafeBottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  listItemContainer: {
    backgroundColor: theme.colors.secondarySurface,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.secondarySurface,
    flex: 1,
  },
  qrCode: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
    borderRadius: 10,
  },
}));
