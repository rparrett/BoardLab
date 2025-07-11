import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Text, Icon } from '@rneui/themed';
import { StyleSheet, View, Image } from 'react-native';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useState, useLayoutEffect } from 'react';
import Loading from '../components/Loading';
import Error from '../components/Error';
import StarRating from '../components/StarRating';
import ImageZoom from 'react-native-image-pan-zoom';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  const navigation = useNavigation();
  const { getClimb, getPlacementData, getRoles, ready } = useDatabase();

  // All hooks must be at the top, before any early returns
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const asyncClimb = useAsync(() => {
    return getClimb(uuid);
  }, [uuid, ready]);

  const asyncPlacementData = useAsync(() => {
    return getPlacementData();
  }, [ready]);

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

  // Header button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BluetoothHeaderButton />,
    });
  }, [navigation]);

  // Early returns after all hooks
  if (asyncClimb.loading || asyncPlacementData.loading || asyncRoles.loading) {
    return <Loading text="Loading climb..." />;
  }

  let asyncError =
    asyncClimb.error || asyncPlacementData.error || asyncRoles.error;
  if (asyncError) {
    return <Error error={asyncError} />;
  }

  if (!asyncClimb.result) {
    return <Error error="Climb not found" />;
  }

  const climb = asyncClimb.result;
  const placementData = asyncPlacementData.result;
  const roles = asyncRoles.result;

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

  const imageWidth = 1080.0;
  const imageHeight = 1170.0;

  const scale = containerDimensions.width / imageWidth;
  const scaledImageHeight = imageHeight * scale;

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

      <View
        style={styles.imageZoomContainer}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
          setContainerDimensions({ width, height });
        }}
      >
        {containerDimensions.width > 0 && (
          // @ts-expect-error: TS2769 react-native-image-pan-zoom has incorrect TypeScript definitions
          <ImageZoom
            cropWidth={containerDimensions.width}
            cropHeight={containerDimensions.height}
            imageWidth={containerDimensions.width}
            imageHeight={scaledImageHeight}
            minScale={1}
            maxScale={4}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require('../assets/45-1.png')}
                style={styles.layeredImage}
                resizeMode="contain"
              />
              <Image
                source={require('../assets/46-1.png')}
                style={styles.layeredImage}
                resizeMode="contain"
              />
              {placementData &&
                roles &&
                Array.from(placements.entries()).map(
                  ([placementId, roleId]) => {
                    const placement = placementData.get(placementId);
                    if (!placement) {
                      console.warn('no placement', placementId);
                      return null;
                    }

                    const role = roles.get(roleId);
                    if (!role) {
                      console.warn('no role', roleId);
                      return null;
                    }

                    let iconSize = 22;
                    let scaledX =
                      placement.x * containerDimensions.width -
                      iconSize / 2 +
                      2;
                    let scaledY =
                      placement.y * scaledImageHeight - iconSize / 2;

                    return (
                      <Icon
                        key={`position-${placementId}`}
                        name="circle-o"
                        type="font-awesome"
                        size={iconSize}
                        color={`#${role.screenColor}`}
                        containerStyle={[
                          styles.positionIndicator,
                          { left: scaledX, top: scaledY },
                        ]}
                      />
                    );
                  },
                )}
            </View>
          </ImageZoom>
        )}
      </View>
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
  imageZoomContainer: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  layeredImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  positionIndicator: {
    position: 'absolute',
    zIndex: 5,
  },
});
