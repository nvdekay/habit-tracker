// checkInService.js - Updated version
import api from "./api"

const BASE_URL = "http://localhost:8080"

// Get current user ID from localStorage token
const getCurrentUserId = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const decoded = JSON.parse(atob(token));
        return decoded.userId;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
}

// Create or update check-in
export async function checkInHabit(habitId, date, completed, notes = '') {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Check if check-in already exists
        const existingResponse = await fetch(`${BASE_URL}/checkins?habitId=${habitId}&date=${date}&userId=${userId}`);
        const existingCheckIns = await existingResponse.json();

        if (existingCheckIns.length > 0) {
            // Update existing check-in
            const checkIn = existingCheckIns[0];
            const response = await fetch(`${BASE_URL}/checkins/${checkIn.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...checkIn,
                    completed,
                    notes,
                    completedAt: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to update check-in');
            return response.json();
        } else {
            // Create new check-in
            const response = await fetch(`${BASE_URL}/checkins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    habitId,
                    date,
                    completed,
                    notes,
                    completedAt: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to create check-in');
            return response.json();
        }
    } catch (error) {
        console.error('Error in checkInHabit:', error);
        throw error;
    }
}

// Get check-ins for specific date
export async function getCheckInsForDate(date) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Get user's active habits
        const habitsResponse = await fetch(`${BASE_URL}/habits?userId=${userId}&isActive=true`);
        if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
        const habits = await habitsResponse.json();

        // Get check-ins for the date
        const checkInsResponse = await fetch(`${BASE_URL}/checkins?userId=${userId}&date=${date}`);
        if (!checkInsResponse.ok) throw new Error('Failed to fetch check-ins');
        const dayCheckIns = await checkInsResponse.json();

        // Map habits with their check-in status
        const habitCheckIns = habits.map(habit => {
            const checkIn = dayCheckIns.find(c => c.habitId.toString() === habit.id.toString());
            return {
                habitId: habit.id,
                habitName: habit.name,
                habitIcon: habit.icon,
                habitColor: habit.color,
                completed: checkIn ? checkIn.completed : false,
                streak: habit.currentStreak || 0,
                notes: checkIn ? checkIn.notes : ''
            };
        });

        // Calculate completion rate
        const completedCount = habitCheckIns.filter(h => h.completed).length;
        const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

        return {
            date,
            habits: habitCheckIns,
            completionRate,
            totalHabits: habits.length,
            completedHabits: completedCount
        };
    } catch (error) {
        console.error('Error in getCheckInsForDate:', error);
        throw error;
    }
}

// Get check-in history for date range
export async function getCheckInHistory(startDate, endDate) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const response = await fetch(`${BASE_URL}/checkins?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch check-in history');
        
        const allCheckIns = await response.json();
        
        // Filter by date range
        return allCheckIns.filter(checkIn => {
            const checkInDate = new Date(checkIn.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return checkInDate >= start && checkInDate <= end;
        });
    } catch (error) {
        console.error('Error in getCheckInHistory:', error);
        throw error;
    }
}

// Get streak data for a habit
export async function getStreakData(habitId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const response = await fetch(`${BASE_URL}/checkins?userId=${userId}&habitId=${habitId}&completed=true`);
        if (!response.ok) throw new Error('Failed to fetch streak data');
        
        const habitCheckIns = await response.json();

        // Sort by date descending
        habitCheckIns.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        const currentDate = new Date(today);

        for (let i = 0; i < 365; i++) { // Check last 365 days max
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasCheckIn = habitCheckIns.some(checkIn => checkIn.date === dateStr);
            
            if (hasCheckIn) {
                currentStreak++;
            } else {
                // Allow skipping today if it's not completed yet
                if (i === 0 && dateStr === today.toISOString().split('T')[0]) {
                    // Skip today, continue checking yesterday
                } else {
                    break;
                }
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let previousDate = null;

        for (const checkIn of habitCheckIns.reverse()) { // Process chronologically
            const currentCheckInDate = new Date(checkIn.date);
            
            if (previousDate) {
                const dayDiff = (currentCheckInDate - previousDate) / (1000 * 60 * 60 * 24);
                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            
            previousDate = currentCheckInDate;
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            currentStreak,
            longestStreak
        };
    } catch (error) {
        console.error('Error in getStreakData:', error);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

// Get calendar data for month view
export async function getCalendarData(year, month) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        // Get user's habits count
        const habitsResponse = await fetch(`${BASE_URL}/habits?userId=${userId}&isActive=true`);
        if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
        const habits = await habitsResponse.json();
        const totalHabits = habits.length;

        // Get check-ins for the month
        const checkInsResponse = await fetch(`${BASE_URL}/checkins?userId=${userId}`);
        if (!checkInsResponse.ok) throw new Error('Failed to fetch check-ins');
        const allCheckIns = await checkInsResponse.json();

        // Filter check-ins for the month
        const monthCheckIns = allCheckIns.filter(checkIn => 
            checkIn.date >= startDate && checkIn.date <= endDate
        );

        const calendarData = {};

        // Calculate completion rate for each day
        for (let date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayCheckIns = monthCheckIns.filter(checkIn => checkIn.date === dateStr);
            const completedCount = dayCheckIns.filter(checkIn => checkIn.completed).length;
            
            calendarData[dateStr] = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
        }

        return calendarData;
    } catch (error) {
        console.error('Error in getCalendarData:', error);
        throw error;
    }
}

// Get weekly summary data
export async function getWeeklySummary(startDate, endDate) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const weekData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayData = await getCheckInsForDate(dateStr);
            
            weekData.push({
                date: dateStr,
                completionRate: dayData.completionRate,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completedHabits: dayData.completedHabits,
                totalHabits: dayData.totalHabits
            });
        }

        return weekData;
    } catch (error) {
        console.error('Error in getWeeklySummary:', error);
        return [];
    }
}