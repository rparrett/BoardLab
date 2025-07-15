import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { ClimbsStackNavigationProp } from '../navigators/ClimbsStack';
import { Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';
import {
  useDatabase,
  DbClimb,
} from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect, useMemo, useEffect, useState } from 'react';
import { IndexedMap } from '../lib/IndexedMap';
import { useAppState } from '../stores/AppState';
import Loading from '../components/Loading';
import Error from '../components/Error';
import StarRating from '../components/StarRating';
import BoardDisplay from '../components/BoardDisplay';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';
import { useBleClimbSender } from '../lib/useBleClimbSender';
import { parseFramesString, type ClimbPlacements } from '../lib/frames-utils';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  const navigation = useNavigation<ClimbsStackNavigationProp>();
  const { getClimb, getFilteredClimbs, ready } = useDatabase();
  const { climbFilters } = useAppState();

  // Cache filtered climbs for fast navigation
  const [climbsCache, setClimbsCache] = useState<IndexedMap<string, DbClimb>>(
    new IndexedMap<string, DbClimb>([], climb => climb.uuid),
  );
  const asyncClimb = useAsync(() => {
    return getClimb(uuid);
  }, [uuid, ready]);
  const { sendToBoard } = useBleClimbSender();

  // Keep track of the currently displayed climb (only update when new data is available)
  const [displayedClimb, setDisplayedClimb] = useState<DbClimb | null>(null);

  // Update displayed climb when new data becomes available
  useEffect(() => {
    if (asyncClimb.result) {
      setDisplayedClimb(asyncClimb.result);
    }
  }, [asyncClimb.result]);

  // Parse frames and set up BLE sender
  const climbPlacements = useMemo((): ClimbPlacements => {
    if (!displayedClimb?.frames) return new Map();
    return parseFramesString(displayedClimb.frames);
  }, [displayedClimb?.frames]);

  // Load and cache filtered climbs for navigation
  useEffect(() => {
    const loadClimbsList = async () => {
      if (!ready) return;

      const filteredClimbs = await getFilteredClimbs(climbFilters);
      setClimbsCache(filteredClimbs);
    };

    loadClimbsList();
  }, [climbFilters, ready, getFilteredClimbs]); // Reload when filters or ready changes

  // Send climb data when it loads (including empty climbs to clear the board)
  useEffect(() => {
    sendToBoard(climbPlacements);
  }, [climbPlacements, sendToBoard]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BluetoothHeaderButton />,
      // We'll be using swipes to navigate to the prev/next item in the filtered
      // climb list. So we need to disable React Navigation's swipe gestures on this
      // screen.
      gestureEnabled: false,
    });
  }, [navigation]);

  const handleSwipeLeft = () => {
    const nextUuid = climbsCache.getNextKey(uuid);
    if (nextUuid) {
      navigation.navigate('Climb', { uuid: nextUuid });
    }
  };

  const handleSwipeRight = () => {
    const previousUuid = climbsCache.getPreviousKey(uuid);
    if (previousUuid) {
      navigation.navigate('Climb', { uuid: previousUuid });
    }
  };

  if (asyncClimb.loading && !displayedClimb) {
    return <Loading text="Loading climb..." />;
  }

  if (asyncClimb.error) {
    return <Error error={asyncClimb.error} />;
  }

  if (!displayedClimb) {
    return <Error error="Climb not found" />;
  }

  const climb = displayedClimb;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{climb.name}</Text>
        <Text style={styles.setter}>{climb.setter_username}</Text>
        <View style={styles.gradeStarsRow}>
          {climb.grade_name && (
            <Text style={styles.grade}>{climb.grade_name}</Text>
          )}
          {climb.total_quality_average && (
            <StarRating rating={climb.total_quality_average} size={16} />
          )}
        </View>
      </View>

      <BoardDisplay
        placements={climbPlacements}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />
      <BluetoothBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  setter: {
    textAlign: 'center',
  },
  gradeStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grade: {},
});
