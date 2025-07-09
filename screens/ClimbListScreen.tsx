import {
  StaticScreenProps,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import {
  FlatList,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import { getClimbsDb, DbClimb } from '../Database';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ListItem, Text } from '@rneui/themed';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import { match, P } from 'ts-pattern';

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

    return (
      <ListItem
        bottomDivider
        Component={TouchableHighlight}
        onPress={() => navigation.navigate('Climb', { uuid: item.uuid })}
      >
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
          {subtitle && <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>}
          <ListItem.Subtitle>
            {item.ascensionist_count} ascensionists
          </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
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
