import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const stored = localStorage.getItem('customerLocation');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing stored location:', e);
    }
    // Check if pincode only was stored previously
    const storedPincode = localStorage.getItem('searchPincode');
    if (storedPincode) {
      return { pincode: storedPincode, city: '', state: '', area: '', lat: null, lon: null };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setLocation = (newLoc) => {
    if (newLoc) {
      setLocationState(newLoc);
      localStorage.setItem('customerLocation', JSON.stringify(newLoc));
      if (newLoc.pincode) {
        localStorage.setItem('searchPincode', newLoc.pincode);
      } else {
        localStorage.removeItem('searchPincode');
      }
    } else {
      setLocationState(null);
      localStorage.removeItem('customerLocation');
      localStorage.removeItem('searchPincode');
    }
    setError(null);
  };

  const detectLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by your browser.';
        setError(errMsg);
        reject(new Error(errMsg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = position.timestamp;
          console.log(`[GPS LOG] Lat: ${latitude}, Lon: ${longitude}, Accuracy: ${accuracy}m, TS: ${timestamp}`);

          if (accuracy > 1000) {
            const errMsg = `Your location accuracy is low (${Math.round(accuracy)} meters). Please move outdoors or enable precise location and try again.`;
            setError(errMsg);
            setLoading(false);
            reject(new Error(errMsg));
            return;
          }

          try {
            // Reverse geocode using OpenStreetMap's Nominatim (free, no API key needed)
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'LocalLoop-ServiceHub'
                }
              }
            );

            if (!res.ok) throw new Error('Failed to fetch address details');
            const data = await res.json();

            const address = data.address || {};
            // Nominatim returns postal codes as 'postcode'
            const pincode = (address.postcode || '').replace(/\s+/g, '');
            const city = address.city || address.town || address.village || address.suburb || address.municipality || address.district || '';
            const state = address.state || '';
            const area = address.suburb || address.neighbourhood || address.quarter || address.county || '';

            const detectedLoc = {
              pincode,
              city,
              state,
              area,
              lat: latitude,
              lon: longitude,
              accuracy: Math.round(accuracy),
              formatted_address: data.display_name || `${city}, ${state}`,
              isDetected: true
            };

            setLoading(false);
            resolve(detectedLoc);
          } catch (err) {
            console.error('Reverse geocoding error:', err);
            const errMsg = 'Unable to determine your address details from GPS coordinates.';
            setError(errMsg);
            setLoading(false);
            reject(err);
          }
        },
        (err) => {
          let errMsg = 'Failed to retrieve your current location.';
          if (err.code === 1) {
            errMsg = 'Location access was denied. Please enter your pincode manually.';
          } else if (err.code === 2) {
            errMsg = 'Position is unavailable. Please check your GPS/network settings.';
          } else if (err.code === 3) {
            errMsg = 'Location request timed out. Please try again.';
          }
          setError(errMsg);
          setLoading(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, detectLocation, loading, error, setError }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
