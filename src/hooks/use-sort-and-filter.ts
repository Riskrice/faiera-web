import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SortType = 'string' | 'date' | 'number';

export interface SortConfig<T> {
    key: keyof T | null;
    direction: SortDirection;
    type: SortType;
}

export function useSortAndFilter<T>(data: T[], searchFields: (keyof T)[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
        key: null,
        direction: 'desc', // Default to newest/descending
        type: 'string'
    });

    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase().trim();
            result = result.filter(item => {
                return searchFields.some(field => {
                    const value = item[field];
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(lowerTerm);
                });
            });
        }

        // 2. Sort
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                let comparison = 0;

                switch (sortConfig.type) {
                    case 'number':
                        comparison = Number(aValue) - Number(bValue);
                        break;
                    case 'date':
                        const dateA = new Date(String(aValue)).getTime();
                        const dateB = new Date(String(bValue)).getTime();
                        comparison = dateA - dateB;
                        break;
                    case 'string':
                    default:
                        // Use localeCompare for correct Arabic/English sorting
                        comparison = String(aValue).localeCompare(String(bValue), ['ar', 'en'], { sensitivity: 'base' });
                        break;
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig, searchFields]);

    const handleSort = (key: keyof T, type: SortType = 'string') => {
        setSortConfig(current => ({
            key,
            type,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const setSort = (key: keyof T, direction: SortDirection, type: SortType = 'string') => {
        setSortConfig({ key, direction, type });
    };

    return {
        searchTerm,
        setSearchTerm,
        sortConfig,
        handleSort, // Toggle sort
        setSort,    // Explicit set
        processedData
    };
}
