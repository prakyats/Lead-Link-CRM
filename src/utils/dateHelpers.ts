/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time
 */
export function formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    try {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return formatDate(dateString);
}

/**
 * Check if a task is overdue
 */
export function isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    const now = new Date();
    return due < now;
}

/**
 * Check if date is within next N days
 */
export function isWithinDays(dateString: string, days: number): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return date >= now && date <= futureDate;
}

// Alias for backward compatibility
export const formatRelativeTime = getRelativeTime;

