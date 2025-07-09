import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SettingsScreen from '../screens/SettingsScreen';
import ClimbsStack from './ClimbsStack';
import { StaticParamList } from '@react-navigation/native';

export type BottomTabsParamList = StaticParamList<typeof BottomTabs>;

const BottomTabs = createBottomTabNavigator({
  screens: {
    Climbs: {
      screen: ClimbsStack,
      options: {
        headerShown: false,
      },
    },
    Settings: SettingsScreen,
  },
});

export default BottomTabs;
