import { useState, useMemo, useEffect } from "react";

export function usePagination<T>(data: T[], initialItemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    // Reset to page 1 if data changes or itemsPerPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, itemsPerPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return data.slice(start, end);
    }, [currentPage, data, itemsPerPage]);

    const hasPreviousPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    const goToPage = (page: number) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    const nextPage = () => {
        if (hasNextPage) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const prevPage = () => {
        if (hasPreviousPage) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    return {
        currentPage,
        totalPages,
        currentItems,
        goToPage,
        nextPage,
        prevPage,
        hasPreviousPage,
        hasNextPage,
        startIndex: (currentPage - 1) * itemsPerPage + 1,
        endIndex: Math.min(currentPage * itemsPerPage, data.length),
        totalItems: data.length,
        itemsPerPage,
        setItemsPerPage
    };
}
