import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Account Created!', 'You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)/orders');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>👨‍🍳</Text>
        </View>
        <Text style={styles.title}>Home Plate</Text>
        <Text style={styles.subtitle}>Cook Dashboard</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#6B7A99"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6B7A99"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleAuth}
            disabled={loading}>
            <Text style={styles.loginBtnText}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchBtnText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B2B4B' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  logoBox: { width: 80, height: 80, backgroundColor: '#2E7D52', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8899BB', textAlign: 'center', marginBottom: 40, marginTop: 6 },
  form: { backgroundColor: '#243454', borderRadius: 24, padding: 24 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8899BB', marginBottom: 8 },
  input: { backgroundColor: '#1B2B4B', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: '#2E4070' },
  loginBtn: { backgroundColor: '#2E7D52', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchBtnText: { color: '#8899BB', fontSize: 13 },
});