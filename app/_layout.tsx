import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace('/');
      return;
    }
    supabase.from('cooks').select('id').eq('user_id', session.user.id).then(({ data }) => {
      if (data && data.length > 0) {
        router.replace('/(tabs)/orders');
      } else {
        router.replace('/onboarding');
      }
    });
  }, [ready, session]);

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}