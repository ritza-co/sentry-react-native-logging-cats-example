import { Text, Button, View, AppState } from 'react-native';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CatsProvider } from './src/context/CatsContext';
import CatListScreen from './src/screens/CatListScreen';
import WinnerScreen from './src/screens/WinnerScreen';

// Initialize Sentry early, before creating any components
Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // Environment configuration
    environment: __DEV__ ? 'development' : 'production',
    // Enable PII collection for debugging
    sendDefaultPii: true,
    // Logging configuration
    enableLogs: true,

    beforeSendLog: (log) => {
        // Only send performance logs if the operation was slow
        if (log.attributes?.operation === 'fetchCats') {
            const duration = log.attributes.duration_ms;
            
            // Discard logs for fast operations (under 2 seconds)
            if (duration < 2000) {
                return null;
            }
            
            // Add a warning tag for slow operations
            log.attributes.performance_warning = true;
        }
        
        // Send the log to Sentry
        return log;
    },
    // Performance monitoring
    tracesSampleRate: 1.0,
    // Release tracking
    release: '1.0.0',
});

// Log app initialization
Sentry.logger.info("App initialized", {
    environment: __DEV__ ? 'development' : 'production',
    release: '1.0.0',
    timestamp: Date.now(),
});

const Tab = createBottomTabNavigator();

function AppTabs() {
    // Track app state changes (active, background, inactive)
    useEffect(() => {
        // Log when tabs component mounts
        Sentry.logger.debug("AppTabs component mounted", {
            component: "AppTabs",
        });

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            // Log app state transitions for debugging app lifecycle
            Sentry.logger.info("App state changed", {
                newState: nextAppState,
                timestamp: Date.now(),
            });

            if (nextAppState === 'background') {
                // Log when app goes to background
                Sentry.logger.debug("App entered background");
            } else if (nextAppState === 'active') {
                // Log when app becomes active
                Sentry.logger.debug("App became active");
            }
        });

        return () => {
            subscription.remove();

            // Log cleanup
            Sentry.logger.debug("AppTabs component unmounting", {
                component: "AppTabs",
            });
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#2196F3',
                    tabBarInactiveTintColor: '#999',
                }}
            >
                <Tab.Screen
                    name="Vote"
                    component={CatListScreen}
                    options={{
                        tabBarLabel: 'Vote',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🐱</Text>,
                    }}
                />
                <Tab.Screen
                    name="Winner"
                    component={WinnerScreen}
                    options={{
                        tabBarLabel: 'Winner',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text>,
                    }}
                />
            </Tab.Navigator>
            <Button
                title='Test Error (with logger)'
                onPress={() => {
                    // Log before capturing exception
                    Sentry.logger.error("Test error triggered by user", {
                        source: "test_button",
                        component: "App",
                    });
                    Sentry.captureException(new Error('Test error from App'));
                }}
            />
        </View>
    );
}

function RootApp() {
    return (
        <CatsProvider>
            <NavigationContainer>
                <AppTabs />
            </NavigationContainer>
        </CatsProvider>
    );
}

// Wrap the root component to enable Sentry's automatic error tracking
export default Sentry.wrap(RootApp);
