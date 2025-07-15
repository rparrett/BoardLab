import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import {
  DbClimb,
  useDatabase,
} from '../contexts/DatabaseProvider';
import { useLayoutEffect, useState } from 'react';
import { Text, SearchBar, Icon, useTheme, makeStyles } from '@rneui/themed';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import ClimbListItem from '../components/ClimbListItem';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { useAsync } from 'react-async-hook';
import { useAppState } from '../stores/AppState';

type Props = StaticScreenProps<{}>;

export default function ClimbListScreen({}: Props) {
  const navigation = useNavigation<ClimbsStackNavigationProp>();
  const { getFilteredClimbs, ready } = useDatabase();
  const { climbFilters, setAngle, setSearchText } = useAppState();
  const [isVisible, setIsVisible] = useState(false);

  const { theme } = useTheme();
  const styles = useStyles();

  const asyncClimbs = useAsync(() => {
    return getFilteredClimbs(climbFilters);
  }, [climbFilters, ready]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Text style={styles.angleSelectButtonText}>{climbFilters.angle}°</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, climbFilters.angle, styles]);

  console.log(asyncClimbs.result);

  const renderItem = ({ item }: { item: DbClimb }) => {
    return (
      <ClimbListItem
        item={item}
        onPress={() =>
          navigation.navigate('Climb', { uuid: item.uuid })
        }
      />
    );
  };

  const handleSelect = (option: { label: string; value: number }) => {
    setAngle(option.value);
    setIsVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <SearchBar
          key="search-bar"
          placeholder="Search"
          value={climbFilters.search}
          onChangeText={setSearchText}
          platform="ios"
          showCancel={false}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
          inputStyle={styles.searchBarInput}
          placeholderTextColor={theme.colors.grey2}
          clearIcon=<Icon
            size={20}
            type="ionicons"
            name="close"
            iconStyle={styles.searchBarIcon}
          />
          searchIcon=<Icon
            size={20}
            type="ionicons"
            name="search"
            iconStyle={styles.searchBarIcon}
          />
        />
        <TouchableOpacity style={styles.filterButton}>
          <Icon
            size={24}
            type="materialicons"
            name="filter-list"
            iconStyle={styles.searchBarIcon}
          />
        </TouchableOpacity>
      </View>
      {asyncClimbs.loading && <Loading text="Loading climbs..." />}
      {asyncClimbs.error && <Error error={asyncClimbs.error} />}
      {!asyncClimbs.loading && !asyncClimbs.error && (
        <FlatList
          data={asyncClimbs.result?.toArray() || []}
          renderItem={renderItem}
          keyExtractor={item => item.uuid}
        />
      )}
      <AngleSelectBottomSheet
        isVisible={isVisible}
        selectedAngle={climbFilters.angle}
        onSelect={handleSelect}
        onBackdropPress={() => setIsVisible(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((theme, _props: Props) => ({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    height: 52,
  },
  searchBarInputContainer: {
    height: 20,
  },
  searchBarInput: {
    fontSize: 15,
    minHeight: 20,
    color: theme.colors.black,
  },
  searchBarIcon: {
    color: theme.colors.grey2,
  },
  filterButton: {
    padding: 4,
    marginRight: 8,
  },
  angleSelectButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    marginRight: 15,
  },
}));
