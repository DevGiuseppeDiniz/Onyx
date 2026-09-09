import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '@/lib/session';
import { color } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Manda para o lugar certo conforme a sessao. */
function Guarda() {
  const { session, carregando } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    SplashScreen.hideAsync();

    const dentroDoApp = segments[0] === '(app)';
    if (!session && dentroDoApp) router.replace('/');
    else if (session && !dentroDoApp) router.replace('/inicio');
  }, [session, carregando, segments, router]);

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: color.canvas, justifyContent: 'center' }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.canvas },
        animation: 'slide_from_right',
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Guarda />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
