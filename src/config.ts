// API configuration using Expo Public Environment Variables
// Automatically reads EXPO_PUBLIC_API_URL during build/start
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://44.213.113.209';

console.log('Payment App Config - API URL:', API_URL);
