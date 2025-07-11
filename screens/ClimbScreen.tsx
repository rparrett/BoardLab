import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect } from 'react';
import Loading from '../components/Loading';
import Error from '../components/Error';
import StarRating from '../components/StarRating';
import BoardDisplay from '../components/BoardDisplay';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  const navigation = useNavigation();
  const { getClimb, ready } = useDatabase();

  const asyncClimb = useAsync(() => {
    return getClimb(uuid);
  }, [uuid, ready]);

  // Header button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BluetoothHeaderButton />,
    });
  }, [navigation]);

  // Early returns after all hooks
  if (asyncClimb.loading) {
    return <Loading text="Loading climb..." />;
  }

  if (asyncClimb.error) {
    return <Error error={asyncClimb.error} />;
  }

  if (!asyncClimb.result) {
    return <Error error="Climb not found" />;
  }

  const climb = asyncClimb.result;

  // Parse the frames string to get position -> role mapping
  const parseFrames = (framesString: string): Map<number, number> => {
    const placementRoleMap = new Map<number, number>();

    const regex = /p(\d+)r(\d+)/g;
    let match;

    while ((match = regex.exec(framesString)) !== null) {
      const placementId = parseInt(match[1], 10);
      const roleId = parseInt(match[2], 10);
      placementRoleMap.set(placementId, roleId);
    }

    return placementRoleMap;
  };

  const placements = parseFrames(climb.frames);

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

      <BoardDisplay placements={placements} />
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
