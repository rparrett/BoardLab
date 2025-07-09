import { createStaticNavigation } from '@react-navigation/native';
import React from 'react';

import BottomTabs, { BottomTabsParamList } from './navigators/BottomTabs';

const Navigation = createStaticNavigation(BottomTabs);

export default function App() {
  return <Navigation />;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends BottomTabsParamList {}
  }
}
