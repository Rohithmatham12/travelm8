import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './src/utils/auth';
import { RootStackParamList } from './src/types';
import { colors } from './src/styles/theme';

import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RoutePlannerScreen from './src/screens/RoutePlannerScreen';
import RouteResultsScreen from './src/screens/RouteResultsScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import TripListScreen from './src/screens/TripListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Auth' | 'Dashboard' | null>(null);

  useEffect(() => {
    Promise.all([getToken(), AsyncStorage.getItem('tm8_onboarded')]).then(([token, onboarded]) => {
      if (token) setInitialRoute('Dashboard');
      else if (onboarded) setInitialRoute('Auth');
      else setInitialRoute('Onboarding');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.orange,
            headerTitleStyle: { fontWeight: '700', color: colors.text1 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RoutePlanner" component={RoutePlannerScreen} options={{ title: 'Plan Route' }} />
          <Stack.Screen name="RouteResults" component={RouteResultsScreen} options={{ title: 'Your Route' }} />
          <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip Detail' }} />
          <Stack.Screen name="TripList" component={TripListScreen} options={{ title: 'My Trips' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
