import { useState, useEffect, useCallback } from 'react';
import { isValidTransaction } from '../utils/formatCurrency';
import { Transaction } from '../types/finance';

export function useLocalStorage(key: string, initialValue: Transaction[]) {
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [storedValue, setStoredValue] = useState<Transaction[]>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      if (item === null) {
        // FR-1: Jika bernilai null, inisialisasi state sebagai array kosong [] tanpa dummy data
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
      const parsed: unknown = JSON.parse(item);
      if (!Array.isArray(parsed)) {
        return initialValue;
      }
      // Filter hanya item yang valid agar aplikasi tidak pernah crash jika localStorage termodifikasi manual
      return parsed.filter(isValidTransaction);
    } catch (error) {
      console.warn(`Gagal membaca localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // FR-1 Auto-Save: Sinkronisasi setiap perubahan state ke localStorage dengan try-catch
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
        setStorageWarning(null);
      }
    } catch (error) {
      console.warn(`Gagal menyimpan ke localStorage key "${key}":`, error);
      setStorageWarning(
        'Penyimpanan lokal (localStorage) dibatasi pada mode browser ini. Perubahan hanya tersimpan sementara hingga tab ditutup.'
      );
    }
  }, [key, storedValue]);

  // Sinkronisasi antar tab jika pengguna membuka Monetra di lebih dari 1 tab browser
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsed: unknown = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setStoredValue(parsed.filter(isValidTransaction));
          }
        } catch (error) {
          console.warn('Gagal menyinkronkan perubahan antar tab:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback(
    (value: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        return nextValue;
      });
    },
    []
  );

  return [storedValue, setValue, storageWarning] as const;
}

