import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from "./types";

export const generateId = (length: number = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

export const sanitizeHTML = (str: string): string => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

export const generatePlatformCredentials = (role: Role, name: string, allUsers: User[]): { platformId: string; idField: 'studentId' | 'teacherId' | 'parentId' | 'adminId'; pin: string; loginId: string } => {
    let idField: 'studentId' | 'teacherId' | 'parentId' | 'adminId';
    let prefix: string;

    switch (role) {
        case 'student': idField = 'studentId'; prefix = 'STU'; break;
        case 'teacher': idField = 'teacherId'; prefix = 'TCH'; break;
        case 'parent': idField = 'parentId'; prefix = 'PAR'; break;
        case 'admin': idField = 'adminId'; prefix = 'ADM'; break;
        default: throw new Error("Cannot generate credentials for this role.");
    }

    const firstName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    let loginId = '';
    let isLoginIdUnique = false;
    while (!isLoginIdUnique) {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const potentialId = `@${firstName}${randomNum}`;
        const idExists = allUsers.some(u => u.loginId === potentialId);
        if (!idExists) {
            loginId = potentialId;
            isLoginIdUnique = true;
        }
    }

    let platformId = '';
    let isPlatformIdUnique = false;
    while (!isPlatformIdUnique) {
        const randomChars = generateId(6).toUpperCase();
        const potentialId = `${prefix}-${randomChars}`;
         const idExists = allUsers.some(u => 
            u.studentId === potentialId || 
            u.teacherId === platformId || 
            u.parentId === platformId || 
            u.adminId === platformId
        );
        if (!idExists) {
            platformId = potentialId;
            isPlatformIdUnique = true;
        }
    }

    const pin = String(Math.floor(100000 + Math.random() * 900000));
    
    return { platformId, idField, pin, loginId };
};

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

// ECO-OPTIMIZATION: Debounced Local Storage Hook
export const useLocalStorage = <T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
            return initialValue instanceof Function ? initialValue() : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    });

    const keyRef = useRef(key);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestValueRef = useRef<T>(storedValue);

    useEffect(() => { keyRef.current = key; }, [key]);

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            setStoredValue(prev => {
                const valueToStore = value instanceof Function ? value(prev) : value;
                latestValueRef.current = valueToStore;

                // DEBOUNCE LOGIC: Reduced to 100ms for responsiveness while maintaining RAM optimization.
                // High values (5s) were causing UI state reversions during re-renders.
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }

                debounceTimerRef.current = setTimeout(() => {
                    window.localStorage.setItem(keyRef.current, JSON.stringify(latestValueRef.current));
                    
                    window.dispatchEvent(new StorageEvent('storage', { 
                        key: keyRef.current, 
                        newValue: JSON.stringify(latestValueRef.current) 
                    }));
                    window.dispatchEvent(new CustomEvent('local-storage-sync', { 
                        detail: { key: keyRef.current, value: latestValueRef.current } 
                    }));
                    debounceTimerRef.current = null;
                }, 100);
                
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        const handleSync = (e: any) => {
            if (e instanceof StorageEvent && e.key === key && e.newValue !== null) {
                setStoredValue(JSON.parse(e.newValue));
            } else if (e instanceof CustomEvent && e.detail.key === key) {
                setStoredValue(e.detail.value);
            }
        };

        window.addEventListener('storage', handleSync);
        window.addEventListener('local-storage-sync', handleSync);
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('local-storage-sync', handleSync);
        };
    }, [key]);

    return [storedValue, setValue];
};