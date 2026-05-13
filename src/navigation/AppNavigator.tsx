import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/HomeScreen'
import { NewReportScreen } from '../screens/NewReportScreen'
import { LiveVideoScreen } from '../screens/LiveVideoScreen'
import { ReportScreen } from '../screens/ReportScreen'
import { SubmittedScreen } from '../screens/SubmittedScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { BarcodeScreen } from '../screens/BarcodeScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewReport" component={NewReportScreen} />
        <Stack.Screen name="LiveVideo" component={LiveVideoScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen
          name="Submitted"
          component={SubmittedScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Barcode" component={BarcodeScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
