import {
  StaticScreenProps,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import { getClimbsDb, DbClimb } from '../Database';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Text } from '@rneui/themed';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import ClimbListItem from '../components/ClimbListItem';

type Props = StaticScreenProps<{}>;

export default function ClimbListScreen({}: Props) {
  const navigation = useNavigation<ClimbsStackNavigationProp>();

  const [climbs, setClimbs] = useState<DbClimb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(40);
  const [isVisible, setIsVisible] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    loadClimbs(selectedAngle);
  }, [selectedAngle]);

  const loadClimbs = async (angle: number) => {
    try {
      setLoading(true);
      const climbsData = await getClimbsDb(angle);
      setClimbs(climbsData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading climbs:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <Text>Loading climbs...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <FlatList
        data={climbs}
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
