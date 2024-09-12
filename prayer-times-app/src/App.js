import React, { useEffect, useState } from 'react';

const fetchWithTimeout = (url, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);

    fetch(url)
      .then(response => {
        clearTimeout(timer);
        if (!response.ok) {
          reject(new Error(`Failed to fetch, status: ${response.status}`));
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
  const [error, setError] = useState(null);

  const mapAdhanResponse = (data) => {
    const timings = data.data[0].timings;
    console.log('Adhan API timings:', timings); // Debugging statement
    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  };

  const mapMuslimSalatResponse = (data) => {
    const timings = data.items[0];
    console.log('MuslimSalat API timings:', timings); // Debugging statement
    return {
      Fajr: timings.fajr,
      Dhuhr: timings.dhuhr,
      Asr: timings.asr,
      Maghrib: timings.maghrib,
      Isha: timings.isha,
    };
  };

  const fetchAdhanAPI = async () => {
    console.log("Fetching Adhan API...");
    try {
      const response = await fetchWithTimeout(
        'https://api.aladhan.com/v1/calendarByCity/2024/8?city=casablanca&country=morocco',
        5000
      );
      const result = await response.json();
      console.log('Adhan API result:', result);

      if (result && result.data && result.data.length > 0) {
        setPrayerTimes(mapAdhanResponse(result));
        setLoading(false);
      } else {
        console.log('Adhan API failed, fetching MuslimSalat API');
        fetchMuslimSalatAPI(); // Fallback
      }
    } catch (error) {
      console.error('Error with Adhan API:', error.message);
      fetchMuslimSalatAPI(); // Fallback to MuslimSalat API
    }
  };

  const fetchMuslimSalatAPI = async () => {
    console.log("Fetching MuslimSalat API...");
    try {
      const response = await fetchWithTimeout(
        'https://muslimsalat.com/Casablanca.json?key=969848a2da5ee97c6964283ef1ad36d0',
        5000
      );
      const result = await response.json();
      console.log('MuslimSalat API result:', result);

      if (result && result.items && result.items.length > 0) {
        setPrayerTimes(mapMuslimSalatResponse(result));
        setLoading(false);
      } else {
        console.log('MuslimSalat API returned invalid data.');
        setError('Could not retrieve prayer times from both APIs.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error with MuslimSalat API:', error.message);
      setError('Both APIs failed to respond.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdhanAPI();
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
