import {
  createStaticNavigation,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import React from 'react';

import BottomTabs, { BottomTabsParamList } from './navigators/BottomTabs';
import { useColorScheme } from 'react-native';
import { createTheme, ThemeProvider, useTheme } from '@rneui/themed';
import { DatabaseProvider } from './contexts/DatabaseProvider';

const Navigation = () => {
  let { theme } = useTheme();
  const scheme = useColorScheme();

  let navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  navigationTheme.colors.background = theme.colors.background;
  navigationTheme.colors.primary = theme.colors.primary;

  let Nav = createStaticNavigation(BottomTabs);
  return <Nav theme={navigationTheme} />;
};

const theme = createTheme({
  darkColors: {
    secondarySurface: 'rgb(18, 18, 18)',
    star: '#fdc700',
  },
  lightColors: {
    secondarySurface: 'rgb(255, 255, 255)',
    star: '#fdc700',
  },
});

export default function App() {
  const scheme = useColorScheme();
  theme.mode = scheme === 'dark' ? 'dark' : 'light';

  return (
    <ThemeProvider theme={theme}>
      <DatabaseProvider>
        <Navigation />
      </DatabaseProvider>
    </ThemeProvider>
  );
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends BottomTabsParamList {}
  }
}
