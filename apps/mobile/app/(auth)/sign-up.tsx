import { useSignUp } from '@clerk/expo'
import { useRouter, Link } from 'expo-router'
import { useState } from 'react'
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignUpScreen(): JSX.Element {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingVerification, setPending] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (): Promise<void> => {
    if (!isLoaded || !signUp) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPending(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (): Promise<void> => {
    if (!isLoaded || !signUp) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(tabs)')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>Casalux</Text>
            <Text style={styles.subtitle}>
              {pendingVerification ? 'Verify your email' : 'Create your account'}
            </Text>
          </View>

          {error.length > 0 && <Text style={styles.error}>{error}</Text>}

          {pendingVerification ? (
            <>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="123456"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>First name</Text>
                  <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholder="Jane" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Last name</Text>
                  <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" placeholder="Doe" placeholderTextColor="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#9CA3AF" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continue</Text>}
              </TouchableOpacity>
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/sign-in">
                  <Text style={styles.link}>Sign in</Text>
                </Link>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F6' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 40, color: '#0E1B32', fontWeight: '700', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  error: { color: '#EF4444', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E3DE',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  btn: { backgroundColor: '#0E1B32', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#0E1B32', fontSize: 14, fontWeight: '600' },
})
