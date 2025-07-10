import {
  StaticScreenProps,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import { DbClimb, useDatabase } from '../contexts/DatabaseProvider';
import { useLayoutEffect, useState } from 'react';
import { Text } from '@rneui/themed';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import ClimbListItem from '../components/ClimbListItem';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { useAsync } from 'react-async-hook';

type Props = StaticScreenProps<{}>;

export default function ClimbListScreen({}: Props) {
  const navigation = useNavigation<ClimbsStackNavigationProp>();
  const { getFilteredClimbs, ready } = useDatabase();
  const [selectedAngle, setSelectedAngle] = useState(40);
  const [isVisible, setIsVisible] = useState(false);

  const { colors } = useTheme();

  const asyncClimbs = useAsync(() => {
    return getFilteredClimbs(selectedAngle);
  }, [selectedAngle, ready]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Text
            style={{ color: colors.primary, fontSize: 16, marginRight: 15 }}
          >
            {selectedAngle}°
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedAngle, colors]);

  const renderItem = ({ item }: { item: DbClimb }) => {
    return (
      <ClimbListItem
        item={item}
        onPress={() => navigation.navigate('Climb', { uuid: item.uuid })}
      />
    );
  };

  const handleSelect = (option: { label: string; value: number }) => {
    setSelectedAngle(option.value);
    setIsVisible(false);
  };

  if (asyncClimbs.loading) {
    return <Loading text="Loading climbs..." />;
  }

  if (asyncClimbs.error) {
    return <Error error={asyncClimbs.error} />;
  }

  return (
    <View>
      <FlatList
        data={asyncClimbs.result || []}
        renderItem={renderItem}
        keyExtractor={item => item.uuid}
      />
      <AngleSelectBottomSheet
        isVisible={isVisible}
        selectedAngle={selectedAngle}
        onSelect={handleSelect}
        onBackdropPress={() => setIsVisible(false)}
      />
    </View>
  );
}
