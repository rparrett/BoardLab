import { StaticScreenProps } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';

type Props = StaticScreenProps<{}>;

export default function SettingsScreen({}: Props) {
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
