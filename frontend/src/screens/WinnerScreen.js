import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useCats } from '../context/CatsContext';

export default function WinnerScreen() {
  const { cats, loading } = useCats();

  // Find highest voted cat
  const winner = cats.reduce((max, cat) => {
    const catScore = (cat.upvotes || 0) - (cat.downvotes || 0);
    const maxScore = (max?.upvotes || 0) - (max?.downvotes || 0);
    return catScore > maxScore ? cat : max;
  }, null);

  const winnerScore = winner ? (winner.upvotes || 0) - (winner.downvotes || 0) : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 This Month's Winner!</Text>

      {winner ? (
        <View style={styles.winnerCard}>
          <Image
            source={{ uri: winner.image_url }}
            style={styles.winnerImage}
            resizeMode="cover"
          />
          <View style={styles.info}>
            <Text style={styles.scoreText}>Score: {winnerScore}</Text>
            <Text style={styles.upvotes}>👍 {winner.upvotes || 0}</Text>
            <Text style={styles.downvotes}>👎 {winner.downvotes || 0}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noWinner}>
          <Text style={styles.noWinnerText}>No votes yet!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9c4',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#f57f17',
  },
  winnerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    width: '100%',
    maxWidth: 400,
  },
  winnerImage: {
    width: '100%',
    height: 400,
  },
  info: {
    padding: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  upvotes: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  downvotes: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
  },
  noWinner: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWinnerText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});
