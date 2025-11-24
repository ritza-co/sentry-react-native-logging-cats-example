import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useCats } from '../context/CatsContext';

export default function CatListScreen() {
  const { cats, loading, error, submitVote } = useCats();

  // Handle vote with Sentry tracking (using both logger and breadcrumbs)
  const handleVote = async (catId, voteType) => {
    // Log user interaction with structured attributes
    Sentry.logger.info("User clicked vote button", {
      catId: catId.toString(),
      voteType,
      feature: "voting",
      action: "button_click",
    });
    
    // Create a scope for this operation with tags
    Sentry.withScope((scope) => {
      // Add tags for filtering in Sentry dashboard
      scope.setTag('feature', 'voting');
      scope.setTag('voteType', voteType);
      scope.setTag('appVersion', '1.0.0');

      // Add breadcrumb BEFORE the action
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: `User initiating ${voteType} for cat ${catId}`,
        level: 'info',
        data: {
          catId: catId.toString(),
          voteType,
        },
      });

      try {
        submitVote(catId, voteType);

        // Log successful vote using logger
        Sentry.logger.info("Vote completed successfully", {
          catId: catId.toString(),
          voteType,
          status: "success",
        });

        // Add breadcrumb on SUCCESS
        Sentry.addBreadcrumb({
          category: 'user-action',
          message: `Successfully voted ${voteType} for cat ${catId}`,
          level: 'info',
          data: {
            catId: catId.toString(),
            voteType,
            status: 'success',
          },
        });
      } catch (err) {
        // Log error using logger with error level
        Sentry.logger.error("Vote failed", {
          catId: catId.toString(),
          voteType,
          errorMessage: err.message,
          component: "CatListScreen",
        });

        // Add breadcrumb on FAILURE
        Sentry.addBreadcrumb({
          category: 'error',
          message: `Vote failed for cat ${catId}: ${err.message}`,
          level: 'warning',
          data: {
            catId: catId.toString(),
            voteType,
            errorMessage: err.message,
          },
        });

        // Capture the exception with context
        Sentry.captureException(err, {
          level: 'error',
          tags: {
            component: 'CatListScreen',
            operation: 'handleVote',
            voteType,
          },
          contexts: {
            vote: {
              catId,
              voteType,
            },
          },
        });
      }
    });
  };

  // Handle test error
  const handleTestError = () => {
    try {
      throw new Error('Test error from CatListScreen');
    } catch (err) {
      Sentry.captureException(err, {
        level: 'error',
        tags: {
          component: 'CatListScreen',
          operation: 'testError',
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading cats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (cats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No cats loaded yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vote on Cats</Text>
      <Button title="Test Error (Send to Sentry)" onPress={handleTestError} color="#f44336" />
      {cats.map(cat => (
        <View key={cat.id} style={styles.catCard}>
          <Image
            source={{ uri: cat.image_url }}
            style={styles.catImage}
            resizeMode="cover"
          />
          <View style={styles.voteSection}>
            <TouchableOpacity
              style={styles.upvoteButton}
              onPress={() => handleVote(cat.id, 'upvote')}
            >
              <Text style={styles.buttonText}>👍 Up</Text>
            </TouchableOpacity>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{cat.upvotes || 0}</Text>
              <Text style={styles.scoreLabel}>up</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{cat.downvotes || 0}</Text>
              <Text style={styles.scoreLabel}>down</Text>
            </View>
            <TouchableOpacity
              style={styles.downvoteButton}
              onPress={() => handleVote(cat.id, 'downvote')}
            >
              <Text style={styles.buttonText}>👎 Down</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  catCard: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  catImage: {
    width: '100%',
    height: 300,
  },
  voteSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  upvoteButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  downvoteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  scoreBox: {
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
});
