import React, { useState, useEffect } from 'react';
import { View, TextInput, SafeAreaView, Alert } from 'react-native';
import { makeStyles, Text, Button } from '@rn-vui/themed';
import Toast from 'react-native-toast-message';
import { useAuthState } from '../stores/AuthState';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signOut, user, isLoading, error, clearError } =
    useAuthState();
  const styles = useStyles();

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Error',
        text2: error,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both username and password',
      });
      return;
    }

    await signIn(username.trim(), password);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (user) {
    // Signed in state
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>

          <View style={styles.form}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>
                Welcome{user.username ? `, ${user.username}` : ''}!
              </Text>
              <Text style={styles.userDetails}>User ID: {user.id}</Text>
              {user.email_address && (
                <Text style={styles.userDetails}>
                  Email: {user.email_address}
                </Text>
              )}
            </View>

            <Button
              title="Sign Out"
              onPress={handleSignOut}
              type="outline"
              containerStyle={styles.signOutButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Sign in form state
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleSignIn}
            containerStyle={styles.signInButton}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  form: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.grey1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey4,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: theme.colors.grey5,
    color: theme.colors.grey1,
  },
  signInButton: {
    marginTop: 16,
  },
  userInfo: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.grey1,
  },
  userDetails: {
    fontSize: 16,
    marginBottom: 8,
    color: theme.colors.grey2,
  },
  signOutButton: {
    marginTop: 16,
  },
}));
