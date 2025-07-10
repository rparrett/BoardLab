import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import ClimbListScreen from '../screens/ClimbListScreen';
import ClimbScreen from '../screens/ClimbScreen';
import { StaticParamList } from '@react-navigation/native';

export type ClimbsStackParamList = StaticParamList<typeof ClimbsStack>;

export type ClimbsStackNavigationProp = StackNavigationProp<
  ClimbsStackParamList,
  'ClimbList'
>;

const ClimbsStack = createStackNavigator({
  screens: {
    ClimbList: {
      screen: ClimbListScreen,
      options: {
        title: 'Climbs',
      },
    },
    Climb: ClimbScreen,
  },
});

export default ClimbsStack;
