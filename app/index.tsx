import { Redirect } from 'expo-router';

// Root index route - immediately redirect to splash screen
export default function Index() {
  return <Redirect href="/screen/splash" />;
}

