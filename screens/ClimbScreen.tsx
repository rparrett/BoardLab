import { StaticScreenProps } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  return (
    <View style={styles.container}>
      <Text>Climb</Text>
      <Text>{uuid}</Text>
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
