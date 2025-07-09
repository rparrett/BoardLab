import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';

type ClimbItem = {
  uuid: string;
};

type Props = StaticScreenProps<{}>;

export default function ClimbListScreen({}: Props) {
  const navigation = useNavigation<ClimbsStackNavigationProp>();

  const data: ClimbItem[] = [
    {
      uuid: 'testuuid',
    },
    {
      uuid: 'testuuid2',
    },
  ];

  const renderItem = ({ item }: { item: ClimbItem }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Climb', { uuid: item.uuid })}
      >
        <Text>{item.uuid}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={data} renderItem={renderItem} />
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
