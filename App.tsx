import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>KeepTab</Text>
      <Text style={styles.subtitle}>Kitchen labels that work offline.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f8f5',
  },
  title: {
    color: '#102a22',
    fontSize: 52,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 12,
    color: '#4f625b',
    fontSize: 24,
  },
});
