import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const CUISINES = ['Mexican', 'Soul Food', 'Asian', 'Indian', 'BBQ', 'Healthy', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<{ [key: string]: { open: boolean; start: string; end: string } }>({});
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (c: string) => {
    setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { open: !prev[day]?.open, start: prev[day]?.start || '5:00 PM', end: prev[day]?.end || '8:00 PM' }
    }));
  };

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleFinish = async () => {
    if (!name || !city || selectedCuisines.length === 0) {
      Alert.alert('Missing Info', 'Please fill in your kitchen name, city, and at least one cuisine.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { error } = await supabase.from('cooks').insert({
        user_id: user.id,
        name,
        city,
        bio,
        cuisines: selectedCuisines,
        pickup_schedule: schedule,
        is_open: false,
        rating: 5.0,
        total_orders: 0,
      });
      if (error) throw error;
      router.replace('/(tabs)/orders');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.progressRow}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
          ))}
        </View>

        {step === 1 && (
          <View>
            <Text style={styles.stepEmoji}>🏡</Text>
            <Text style={styles.stepTitle}>Your Kitchen</Text>
            <Text style={styles.stepSub}>Tell buyers about your home kitchen</Text>

            <Text style={styles.label}>KITCHEN NAME</Text>
            <TextInput style={styles.input} placeholder="e.g. Andre's BBQ" placeholderTextColor="#6B7A99" value={name} onChangeText={setName} />

            <Text style={styles.label}>CITY</Text>
            <TextInput style={styles.input} placeholder="e.g. Fountain Valley, CA" placeholderTextColor="#6B7A99" value={city} onChangeText={setCity} />

            <Text style={styles.label}>BIO</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Tell buyers about yourself and your cooking..." placeholderTextColor="#6B7A99" value={bio} onChangeText={setBio} multiline />

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepEmoji}>🍽️</Text>
            <Text style={styles.stepTitle}>Your Cuisine</Text>
            <Text style={styles.stepSub}>What type of food do you make?</Text>

            <View style={styles.cuisineGrid}>
              {CUISINES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cuisinePill, selectedCuisines.includes(c) && styles.cuisinePillActive]}
                  onPress={() => toggleCuisine(c)}>
                  <Text style={[styles.cuisinePillText, selectedCuisines.includes(c) && styles.cuisinePillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.navBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepEmoji}>🕐</Text>
            <Text style={styles.stepTitle}>Pickup Schedule</Text>
            <Text style={styles.stepSub}>Tap a day to toggle it open</Text>

            {DAYS.map((day) => {
              const d = schedule[day] || { open: false, start: '5:00 PM', end: '8:00 PM' };
              return (
                <View key={day} style={styles.dayRow}>
                  <TouchableOpacity
                    style={[styles.dayToggle, d.open && styles.dayToggleActive]}
                    onPress={() => toggleDay(day)}>
                    <Text style={[styles.dayToggleText, d.open && styles.dayToggleTextActive]}>{day}</Text>
                  </TouchableOpacity>
                  {d.open ? (
                    <View style={styles.dayTimes}>
                      <TextInput
                        style={styles.timeInput}
                        value={d.start}
                        onChangeText={(v) => updateTime(day, 'start', v)}
                        placeholder="5:00 PM"
                        placeholderTextColor="#6B7A99"
                      />
                      <Text style={styles.timeSep}>→</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={d.end}
                        onChangeText={(v) => updateTime(day, 'end', v)}
                        placeholder="8:00 PM"
                        placeholderTextColor="#6B7A99"
                      />
                    </View>
                  ) : (
                    <Text style={styles.dayClosed}>Closed</Text>
                  )}
                </View>
              );
            })}

            <View style={[styles.navBtns, { marginTop: 24 }]}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, loading && { opacity: 0.6 }]}
                onPress={handleFinish}
                disabled={loading}>
                <Text style={styles.nextBtnText}>{loading ? 'Setting up...' : '🚀 Launch Kitchen'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B2B4B' },
  content: { padding: 24, paddingTop: 80 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 40, justifyContent: 'center' },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E4070' },
  progressDotActive: { backgroundColor: '#2E7D52', width: 24 },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  stepSub: { fontSize: 14, color: '#8899BB', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8899BB', marginBottom: 8 },
  input: { backgroundColor: '#243454', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: '#2E4070' },
  cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  cuisinePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#243454', borderWidth: 1.5, borderColor: '#2E4070' },
  cuisinePillActive: { backgroundColor: '#2E7D52', borderColor: '#2E7D52' },
  cuisinePillText: { color: '#8899BB', fontSize: 13, fontWeight: '600' },
  cuisinePillTextActive: { color: '#fff' },
  navBtns: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#243454', borderWidth: 1.5, borderColor: '#2E4070' },
  backBtnText: { color: '#8899BB', fontSize: 14, fontWeight: '600' },
  nextBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#2E7D52' },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  dayToggle: { width: 44, height: 36, borderRadius: 10, backgroundColor: '#243454', borderWidth: 1.5, borderColor: '#2E4070', alignItems: 'center', justifyContent: 'center' },
  dayToggleActive: { backgroundColor: '#2E7D52', borderColor: '#2E7D52' },
  dayToggleText: { color: '#8899BB', fontSize: 12, fontWeight: '700' },
  dayToggleTextActive: { color: '#fff' },
  dayTimes: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, backgroundColor: '#243454', borderRadius: 10, padding: 8, fontSize: 13, color: '#fff', borderWidth: 1, borderColor: '#2E4070', textAlign: 'center' },
  timeSep: { color: '#8899BB', fontSize: 14 },
  dayClosed: { flex: 1, color: '#6B7A99', fontSize: 13, paddingLeft: 8 },
});