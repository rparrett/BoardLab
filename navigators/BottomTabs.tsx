import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SettingsScreen from '../screens/SettingsScreen';
import ClimbsStack from './ClimbsStack';
import { StaticParamList } from '@react-navigation/native';
import { Icon } from '@rn-vui/themed';
import CreateScreen from '../screens/CreateScreen';

export type BottomTabsParamList = StaticParamList<typeof BottomTabs>;

const BottomTabs = createBottomTabNavigator({
  screens: {
    Climbs: {
      screen: ClimbsStack,
      options: {
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Icon
            name="sports-handball"
            type="material"
            color={color}
            size={size}
          />
        ),
      },
    },
    Create: {
      screen: CreateScreen,
      options: {
        tabBarIcon: ({ color, size }) => (
          <Icon name="create" type="material" color={color} size={size} />
        ),
      },
    },
    Settings: {
      screen: SettingsScreen,
      options: {
        tabBarIcon: ({ color, size }) => (
          <Icon name="settings" type="material" color={color} size={size} />
        ),
      },
    },
  },
});

export default BottomTabs;
