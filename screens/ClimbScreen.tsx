import { StaticScreenProps } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import Loading from '../components/Loading';
import Error from '../components/Error';

type Props = StaticScreenProps<{
  uuid: string;
}>;

export default function ClimbScreen({ route }: Props) {
  let { params } = route;
  let { uuid } = params;
  const { getClimb, ready } = useDatabase();

  const asyncClimb = useAsync(() => {
    return getClimb(uuid);
  }, [uuid, ready]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{climb.name}</Text>
      <Text>Set by: {climb.setter_username}</Text>
      {climb.description && <Text>{climb.description}</Text>}
      {climb.grade_name && <Text>Grade: {climb.grade_name}</Text>}
      {climb.fa_username && <Text>First ascent: {climb.fa_username}</Text>}
      {climb.total_ascensionist_count && (
        <Text style={styles.stats}>
          {climb.total_ascensionist_count} ascensionist
          {climb.total_ascensionist_count !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
