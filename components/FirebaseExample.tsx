import { onAuthStateChangeHelper, signInAnonymouslyHelper, signOutHelper } from '@/utils/firebaseHelpers';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const FirebaseExample = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChangeHelper((authUser) => {
      setUser(authUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInAnonymouslyHelper();
      if (!result.success) {
        console.error('Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const result = await signOutHelper();
      if (!result.success) {
        console.error('Sign out failed');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Authentication Example</Text>
      
      {user ? (
        <View>
          <Text style={styles.userText}>Signed in as: {user.uid}</Text>
          <Button 
            title={loading ? "Signing out..." : "Sign Out"} 
            onPress={handleSignOut} 
            disabled={loading}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.userText}>Not signed in</Text>
          <Button 
            title={loading ? "Signing in..." : "Sign In Anonymously"} 
            onPress={handleSignIn} 
            disabled={loading}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  userText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default FirebaseExample;