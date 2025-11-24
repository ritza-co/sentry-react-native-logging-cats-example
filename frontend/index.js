import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('cat-voting-frontend', () => App);
AppRegistry.runApplication('cat-voting-frontend', {
  rootTag: document.getElementById('root'),
});
