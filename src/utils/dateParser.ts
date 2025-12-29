/**
 * Parse natural language dates from task text
 * Examples:
 * - "tomorrow" -> tomorrow's date
 * - "next week" -> 7 days from now
 * - "dec 31" -> December 31 of current/next year
 * - "monday" -> next Monday
 */
export function parseDateFromText(text: string): Date | null {
    const lowerText = text.toLowerCase();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Tomorrow
    if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }

    // Today
    if (lowerText.includes('today')) {
        return now;
    }

    // Next week
    if (lowerText.includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
    }

    // Next month
    if (lowerText.includes('next month')) {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
    }

    // Day of week (e.g., "monday", "tuesday")
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
        if (lowerText.includes(days[i])) {
            const targetDay = i;
            const currentDay = now.getDay();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
            const date = new Date(now);
            date.setDate(date.getDate() + daysToAdd);
            return date;
        }
    }

    // Month + date (e.g., "dec 31", "january 15")
    const monthRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})/i;
    const monthMatch = text.match(monthRegex);
    if (monthMatch) {
        const monthAbbr = monthMatch[1].toLowerCase();
        const day = parseInt(monthMatch[2]);
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = months.findIndex(m => monthAbbr.startsWith(m));

        if (monthIndex !== -1 && day >= 1 && day <= 31) {
            let year = now.getFullYear();
            const date = new Date(year, monthIndex, day);
            date.setHours(0, 0, 0, 0);

            // If the date has passed this year, use next year
            if (date < now) {
                date.setFullYear(year + 1);
            }
            return date;
        }
    }

    // Numeric date formats (MM/DD or DD/MM - assume MM/DD for US)
    const numericRegex = /(\d{1,2})[\/\-](\d{1,2})/;
    const numericMatch = text.match(numericRegex);
    if (numericMatch) {
        const month = parseInt(numericMatch[1]) - 1; // 0-indexed
        const day = parseInt(numericMatch[2]);

        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            let year = now.getFullYear();
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            // If the date has passed this year, use next year
            if (date < now) {
                date.setFullYear(year + 1);
            }
            return date;
        }
    }

    return null;
}
