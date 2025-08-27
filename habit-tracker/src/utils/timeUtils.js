// Utility functions for time handling in habit tracker

/**
 * Convert time string to minutes from midnight
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM:SS"
 * @returns {number} Minutes from midnight
 */
export const timeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to time string
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time in format "HH:MM"
 */
export const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Format time string for display (12-hour format)
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM:SS"
 * @returns {string} Formatted time like "2:30 PM"
 */
export const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Check if current time is within specified minutes of target time
 * @param {string} targetTime - Target time in "HH:MM" format
 * @param {number} withinMinutes - Minutes threshold
 * @returns {boolean} True if within threshold
 */
export const isTimeWithinRange = (targetTime, withinMinutes = 120) => {
    if (!targetTime) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = timeToMinutes(targetTime);

    const diff = targetMinutes - currentMinutes;
    return diff > 0 && diff <= withinMinutes;
};

/**
 * Get time difference in human readable format
 * @param {string} targetTime - Target time in "HH:MM" format
 * @returns {string} Human readable time difference
 */
export const getTimeDifference = (targetTime) => {
    if (!targetTime) return '';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = timeToMinutes(targetTime);

    const diff = targetMinutes - currentMinutes;

    if (diff <= 0) return 'Now';
    if (diff < 60) return `${diff}m`;

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
};

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range
 * @param {string} end1 - End time of first range  
 * @param {string} start2 - Start time of second range
 * @param {string} end2 - End time of second range
 * @returns {boolean} True if ranges overlap
 */
export const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

/**
 * Get next occurrence of a weekly habit
 * @param {Array} frequencies - Array of frequency objects with weekday
 * @param {Date} fromDate - Date to calculate from (default: today)
 * @returns {Date|null} Next occurrence date
 */
export const getNextWeeklyOccurrence = (frequencies, fromDate = new Date()) => {
    if (!frequencies || frequencies.length === 0) return null;

    const today = fromDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    let nextOccurrence = null;
    let minDaysAhead = 8; // More than a week

    frequencies.forEach(freq => {
        const habitDay = freq.weekday === 7 ? 0 : freq.weekday; // Convert Sunday
        let daysAhead = habitDay - today;

        if (daysAhead <= 0) {
            daysAhead += 7; // Next week
        }

        if (daysAhead < minDaysAhead) {
            minDaysAhead = daysAhead;
            nextOccurrence = new Date(fromDate);
            nextOccurrence.setDate(fromDate.getDate() + daysAhead);
        }
    });

    return nextOccurrence;
};

/**
 * Get next occurrence of a monthly habit
 * @param {Array} frequencies - Array of frequency objects with day
 * @param {Date} fromDate - Date to calculate from (default: today)
 * @returns {Date|null} Next occurrence date
 */
export const getNextMonthlyOccurrence = (frequencies, fromDate = new Date()) => {
    if (!frequencies || frequencies.length === 0) return null;

    const today = fromDate.getDate();
    let nextOccurrence = null;
    let minDaysAhead = 32; // More than a month

    frequencies.forEach(freq => {
        let targetDate = new Date(fromDate);
        targetDate.setDate(freq.day);

        // If the day has passed this month, move to next month
        if (freq.day <= today) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }

        // Handle months with fewer days (e.g., February 31st -> March 3rd)
        if (targetDate.getDate() !== freq.day) {
            targetDate.setDate(0); // Go to last day of previous month
        }

        const daysAhead = Math.ceil((targetDate - fromDate) / (1000 * 60 * 60 * 24));

        if (daysAhead >= 0 && daysAhead < minDaysAhead) {
            minDaysAhead = daysAhead;
            nextOccurrence = targetDate;
        }
    });

    return nextOccurrence;
};

/**
 * Check if a habit should be active on a specific date
 * @param {Object} habit - Habit object
 * @param {Date} date - Target date
 * @returns {boolean} True if habit should be active
 */
export const isHabitActiveOnDate = (habit, date) => {
    if (!habit || !date) return false;

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();

    switch (habit.type) {
        case 'daily':
            return true;

        case 'weekly':
            return habit.frequency.some(freq => {
                const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                return habitDay === dayOfWeek;
            });

        case 'monthly':
            return habit.frequency.some(freq => freq.day === dayOfMonth);

        default:
            return false;
    }
};

/**
 * Get the scheduled time for a habit on a specific date
 * @param {Object} habit - Habit object
 * @param {Date} date - Target date
 * @returns {Object|null} Object with startTime and endTime, or null
 */
export const getHabitTimeForDate = (habit, date) => {
    if (!habit || !date) return null;

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();

    switch (habit.type) {
        case 'daily':
            return {
                startTime: habit.frequency.startTime,
                endTime: habit.frequency.endTime
            };

        case 'weekly':
            const weeklyFreq = habit.frequency.find(freq => {
                const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                return habitDay === dayOfWeek;
            });
            return weeklyFreq ? {
                startTime: weeklyFreq.startTime,
                endTime: weeklyFreq.endTime
            } : null;

        case 'monthly':
            const monthlyFreq = habit.frequency.find(freq => freq.day === dayOfMonth);
            return monthlyFreq ? {
                startTime: monthlyFreq.startTime,
                endTime: monthlyFreq.endTime
            } : null;

        default:
            return null;
    }
};

/**
 * Sort habits by their scheduled time
 * @param {Array} habits - Array of habit objects
 * @param {Date} date - Target date
 * @returns {Array} Sorted habits array
 */
export const sortHabitsByTime = (habits, date) => {
    if (!habits || habits.length === 0) return [];

    return [...habits].sort((a, b) => {
        const timeA = getHabitTimeForDate(a, date);
        const timeB = getHabitTimeForDate(b, date);

        // Habits without time go to end
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;

        // Compare start times
        const minutesA = timeToMinutes(timeA.startTime);
        const minutesB = timeToMinutes(timeB.startTime);

        return minutesA - minutesB;
    });
};

/**
 * Generate time options for select dropdown (15-minute intervals)
 * @param {string} startTime - Start time in "HH:MM" format (default: "00:00")
 * @param {string} endTime - End time in "HH:MM" format (default: "23:45")
 * @returns {Array} Array of time options with label and value
 */
export const generateTimeOptions = (startTime = "00:00", endTime = "23:45") => {
    const options = [];
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 15) {
        const timeString = minutesToTime(minutes);
        options.push({
            value: timeString,
            label: formatTimeForDisplay(timeString)
        });
    }

    return options;
};

/**
 * Validate time string format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid time format
 */
export const isValidTimeFormat = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return false;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeString);
};

/**
 * Get current time in "HH:MM" format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};