import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import { DbClimb, useDatabase } from '../contexts/DatabaseProvider';
import { useLayoutEffect, useState } from 'react';
import {
  SearchBar,
  Icon,
  useTheme,
  makeStyles,
  withBadge,
} from '@rn-vui/themed';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import FiltersBottomSheet from '../components/FiltersBottomSheet';
import ClimbListItem from '../components/ClimbListItem';
import ClimbListScreenHeaderRight from '../components/ClimbListScreenHeaderRight';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { useAsync } from 'react-async-hook';
import { useAppState } from '../stores/AppState';

type Props = StaticScreenProps<{}>;

export default function ClimbListScreen({}: Props) {
  const navigation = useNavigation<ClimbsStackNavigationProp>();
  const { getFilteredClimbs, ready } = useDatabase();
  const { climbFilters, setAngle, setSearchText, lastViewedClimb } =
    useAppState();

  const activeFilterCount =
    (climbFilters.grades?.length > 0 ? 1 : 0) +
    (climbFilters.setAtCurrentAngle ? 1 : 0) +
    (climbFilters.discoveryMode ? 1 : 0);

  const { theme } = useTheme();
  const styles = useStyles();

  const BadgedIcon = withBadge(activeFilterCount, {
    hidden: activeFilterCount === 0,
    status: 'primary',
    top: -2,
    right: -2,
    badgeStyle: styles.badge,
  })(Icon);
  const [isAngleSelectVisible, setIsAngleSelectVisible] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const asyncClimbs = useAsync(() => {
    return getFilteredClimbs(climbFilters);
  }, [climbFilters, ready]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ClimbListScreenHeaderRight
          angle={climbFilters.angle}
          onAnglePress={() => setIsAngleSelectVisible(true)}
        />
      ),
    });
  }, [navigation, climbFilters.angle, lastViewedClimb]);

  const renderItem = ({ item }: { item: DbClimb }) => {
    return (
      <ClimbListItem
        item={item}
        onPress={() => navigation.navigate('Climb', { uuid: item.uuid })}
      />
    );
  };

  const handleSelect = (option: { label: string; value: number }) => {
    setAngle(option.value);
    setIsAngleSelectVisible(false);
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
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFiltersVisible(true)}
        >
          <BadgedIcon
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
        isVisible={isAngleSelectVisible}
        selectedAngle={climbFilters.angle}
        onSelect={handleSelect}
        onBackdropPress={() => setIsAngleSelectVisible(false)}
      />
      <FiltersBottomSheet
        isVisible={isFiltersVisible}
        onBackdropPress={() => setIsFiltersVisible(false)}
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
  badge: {
    borderWidth: 0,
  },
}));
