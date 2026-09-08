import { useState, useEffect } from 'react';

let cachedVersion: string | null = null;
let fetchPromise: Promise<string> | null = null;

export function useLatestVersion(fallbackVersion: string = 'v1.4.0') {
  const [version, setVersion] = useState(cachedVersion || fallbackVersion);

  useEffect(() => {
    if (cachedVersion) {
      setVersion(cachedVersion);
      return;
    }
    
    if (!fetchPromise) {
      fetchPromise = fetch('https://api.github.com/repos/rzayevsahil/Shotera/releases/latest')
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          if (data.tag_name) {
            cachedVersion = data.tag_name;
            return data.tag_name;
          }
          return fallbackVersion;
        })
        .catch(err => {
          console.error('Failed to fetch latest Shotera version from GitHub:', err);
          return fallbackVersion;
        });
    }

    fetchPromise.then(v => setVersion(v));
  }, [fallbackVersion]);

  return version;
}
