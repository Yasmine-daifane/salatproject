import React, { useEffect, useState } from 'react';

const fetchWithTimeout = (url, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);

    fetch(url)
      .then(response => {
        clearTimeout(timer);
        if (!response.ok) {
          reject(new Error('Failed to fetch'));
        } else {
          resolve(response);
        }
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const PrayerTimesApp = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // To display an error message

  const mapFirstApiResponse = (data) => {
    const timings = data.data[0].timings;
    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  };

  const mapSecondApiResponse = (data) => {
    const timings = data.items[0].timings;
    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  };

  const fetchFirstAPI = async () => {
    try {
      console.log('Fetching from Adhan API...');
      const response = await fetchWithTimeout(
        'https://api.aladhan.com/v1/calendarByCity/2024/8?city=casablanca&country=morocco',
        5000
      );
      const result = await response.json();
      console.log('Adhan API response:', result);

      if (response.ok && result && result.data && result.data.length > 0) {
        setPrayerTimes(mapFirstApiResponse(result)); // Set prayer times from Adhan API
        setLoading(false);
      } else {
        console.log('Adhan API returned invalid data, trying MuslimSalat API...');
        fetchSecondAPI(); // Fallback to MuslimSalat API if Adhan API returns invalid data
      }
    } catch (error) {
      console.error("Error with Adhan API:", error);
      fetchSecondAPI(); // Fallback to MuslimSalat API on error
    }
  };

  const fetchSecondAPI = async () => {
    try {
      console.log('Fetching from MuslimSalat API...');
      const response = await fetchWithTimeout(
        'https://muslimsalat.com/Casablanca.json?key=969848a2da5ee97c6964283ef1ad36d0',
        5000
      );
      const result = await response.json();
      console.log('MuslimSalat API response:', result);

      if (response.ok && result && result.items && result.items.length > 0) {
        setPrayerTimes(mapSecondApiResponse(result)); // Set prayer times from MuslimSalat API
      } else {
        console.error('MuslimSalat API returned invalid data.');
        setError('Could not retrieve prayer times from both APIs.');
      }
    } catch (error) {
      console.error("Error with MuslimSalat API:", error);
      setError('Both APIs failed to respond.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirstAPI();
  }, []);

  if (loading) {
    return <p>Loading prayer times...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Prayer Times</h1>
      {prayerTimes ? (
        <ul>
          {Object.entries(prayerTimes).map(([prayer, time]) => (
            <li key={prayer}>
              {prayer}: {time}
            </li>
          ))}
        </ul>
      ) : (
        <p>Could not retrieve prayer times.</p>
      )}
    </div>
  );
};

export default PrayerTimesApp;
