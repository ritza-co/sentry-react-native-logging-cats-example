import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { api } from '../services/api';

const CatsContext = createContext();

export function CatsProvider({ children }) {
  const [cats, setCats] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cats from backend
  const fetchCats = async () => {
    setLoading(true);
    setError(null);
    
    // Log the start of data loading operation
    Sentry.logger.info("Starting to fetch cats", {
      operation: "fetchCats",
      timestamp: Date.now(),
    });
    
    try {
      const startTime = Date.now();
      
      // Get all cats with votes
      const catsData = await api.get('/api/cats');
      
      // Only fetch from Cat API if database is empty
      if (catsData.length === 0) {
        // Log when database is empty and external API is needed
        Sentry.logger.info("Database empty, fetching from external Cat API", {
          operation: "fetchCats",
          externalAPI: "thecatapi.com",
        });
        
        const response = await fetch('https://api.thecatapi.com/v1/images/search?limit=10');
        const newCats = await response.json();

        // Add to backend database
        await api.post('/api/cats', { cats: newCats });

        // Get all cats again with votes
        const updatedCats = await api.get('/api/cats');
        setCats(updatedCats);
        
        const duration = Date.now() - startTime;
        
        // Log successful fetch with performance metrics
        Sentry.logger.info("Cats fetched and saved successfully", {
          count: updatedCats.length,
          duration_ms: duration,
          source: "external_api",
        });
      } else {
        setCats(catsData);
        const duration = Date.now() - startTime;
        
        // Log successful fetch from database
        Sentry.logger.info("Cats loaded from database", {
          count: catsData.length,
          duration_ms: duration,
          source: "database",
          operation: "fetchCats",
        });
      }
    } catch (err) {
      setError(err.message);
      
      // Log error with full context
      Sentry.logger.error("Failed to fetch cats", {
        errorMessage: err.message,
        errorType: err.name,
        operation: "fetchCats",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch winner
  const fetchWinner = async () => {
    // Log winner fetch operation
    Sentry.logger.debug("Fetching current winner", {
      operation: "fetchWinner",
    });
    
    try {
      const winnerData = await api.get('/api/winner');
      setWinner(winnerData);
      
      // Log successful winner fetch
      Sentry.logger.debug("Winner fetched successfully", {
        winnerId: winnerData?.id,
        winnerScore: winnerData?.upvotes,
      });
    } catch (err) {
      // Log winner fetch error
      Sentry.logger.error("Failed to fetch winner", {
        errorMessage: err.message,
        operation: "fetchWinner",
      });
    }
  };

  // Submit a vote
  const submitVote = async (catId, voteType) => {
    // Log vote submission attempt
    Sentry.logger.info("Submitting vote", {
      catId: catId.toString(),
      voteType,
      operation: "submitVote",
    });
    
    try {
      await api.post('/api/votes', { cat_id: catId, vote_type: voteType });
      
      // Log successful vote submission
      Sentry.logger.info("Vote submitted successfully", {
        catId: catId.toString(),
        voteType,
      });
      
      // Refresh cats and winner
      await fetchCats();
      await fetchWinner();
    } catch (err) {
      // Log vote submission error
      Sentry.logger.error("Vote submission failed", {
        catId: catId.toString(),
        voteType,
        errorMessage: err.message,
      });
      
      setError(err.message);
    }
  };

  // Load data on mount
  useEffect(() => {
    // Log app initialization
    Sentry.logger.info("CatsProvider initialized, loading initial data", {
      component: "CatsProvider",
      event: "mount",
    });
    
    fetchCats();
    fetchWinner();
    
    return () => {
      // Log cleanup when provider unmounts
      Sentry.logger.debug("CatsProvider unmounting", {
        component: "CatsProvider",
        event: "unmount",
        catsLoaded: cats.length,
      });
    };
  }, []);

  return (
    <CatsContext.Provider value={{
      cats,
      winner,
      loading,
      error,
      submitVote,
      fetchCats,
      fetchWinner,
    }}>
      {children}
    </CatsContext.Provider>
  );
}

export function useCats() {
  const context = useContext(CatsContext);
  if (!context) {
    throw new Error('useCats must be used within CatsProvider');
  }
  return context;
}
