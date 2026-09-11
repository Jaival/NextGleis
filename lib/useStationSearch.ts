import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { searchStations } from './api';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// Debounced stop search, shared by the Search tab and the Routes tab's stop
// picker. Every search fans out to all networks on the backend, so it waits
// for the typing to settle rather than firing on each keystroke.
export function useStationSearch(input: string, enabled = true) {
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [input]);

  const { data, isFetching, isError, fetchStatus } = useQuery({
    queryKey: ['stations', debounced],
    queryFn: ({ signal }) => searchStations(debounced, signal),
    enabled: enabled && debounced.length >= MIN_QUERY_LENGTH,
  });

  return {
    debounced,
    tooShort: debounced.length < MIN_QUERY_LENGTH,
    data,
    isFetching,
    isError,
    isOffline: fetchStatus === 'paused',
  };
}

export type StationSearch = ReturnType<typeof useStationSearch>;
