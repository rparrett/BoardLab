import { StaticScreenProps } from '@react-navigation/native';
import { Text, Icon } from '@rneui/themed';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import Loading from '../components/Loading';
import Error from '../components/Error';
import StarRating from '../components/StarRating';
import ImageZoom from 'react-native-image-pan-zoom';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  const { getClimb, getPlacementData, getRoles, ready } = useDatabase();
  const { width: screenWidth } = Dimensions.get('window');

  const imageWidth = 1080.0;
  const imageHeight = 1170.0;

  const scale = screenWidth / imageWidth;
  const scaledImageHeight = imageHeight * scale;

  const asyncClimb = useAsync(() => {
    return getClimb(uuid);
  }, [uuid, ready]);

  const asyncPlacementData = useAsync(() => {
    return getPlacementData();
  }, [ready]);

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

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

      <ImageZoom
        cropWidth={screenWidth}
        cropHeight={scaledImageHeight}
        imageWidth={screenWidth}
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
            Array.from(placements.entries()).map(([placementId, roleId]) => {
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
              let scaledX = placement.x * screenWidth - iconSize / 2 + 2;
              let scaledY = placement.y * scaledImageHeight - iconSize / 2;

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
            })}
        </View>
      </ImageZoom>
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
