// services/checkInService.js
import { supabase } from './supabaseConfig';

// Get current user ID
const getCurrentUserId = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user ? user.id : null;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
};

// Create or update check-in
export async function checkInHabit(habitId, date, completed, notes = '') {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Check if check-in already exists
        const { data: existingCheckIns, error: fetchError } = await supabase
            .from('checkins')
            .select('*')
            .eq('habit_id', habitId)
            .eq('date', date)
            .eq('user_id', userId);

        if (fetchError) throw fetchError;

        if (existingCheckIns && existingCheckIns.length > 0) {
            // Update existing check-in
            const checkIn = existingCheckIns[0];
            const { data, error } = await supabase
                .from('checkins')
                .update({
                    completed,
                    notes,
                    completed_at: new Date().toISOString()
                })
                .eq('id', checkIn.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Create new check-in
            const { data, error } = await supabase
                .from('checkins')
                .insert([{
                    user_id: userId,
                    habit_id: habitId,
                    date,
                    completed,
                    notes,
                    completed_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error in checkInHabit:', error);
        throw error;
    }
}

// Get check-ins for specific date
export async function getCheckInsForDate(date) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Get user's active habits
        const { data: habits, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (habitsError) throw habitsError;

        // Filter habits that should be active on this date
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfMonth = targetDate.getDate();

        const activeHabitsForDate = habits.filter(habit => {
            const startDate = new Date(habit.start_date);
            const endDate = habit.end_date ? new Date(habit.end_date) : null;

            // Check if date is within habit's date range
            if (targetDate < startDate) return false;
            if (endDate && targetDate > endDate) return false;

            if (habit.type === 'daily') return true;

            if (habit.type === 'weekly') {
                return habit.frequency.some(freq => {
                    const habitDay = freq.weekday === 7 ? 0 : freq.weekday; // Convert Sunday
                    return habitDay === dayOfWeek;
                });
            }

            if (habit.type === 'monthly') {
                return habit.frequency.some(freq => freq.day === dayOfMonth);
            }

            return false;
        });

        // Get check-ins for the date
        const { data: dayCheckIns, error: checkInsError } = await supabase
            .from('checkins')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date);

        if (checkInsError) throw checkInsError;

        // Map habits with their check-in status
        const habitCheckIns = activeHabitsForDate.map(habit => {
            const checkIn = dayCheckIns?.find(c => c.habit_id === habit.id);
            return {
                habitId: habit.id,
                habitName: habit.name,
                completed: checkIn ? checkIn.completed : false,
                notes: checkIn ? checkIn.notes : ''
            };
        });

        // Calculate completion rate
        const completedCount = habitCheckIns.filter(h => h.completed).length;
        const completionRate = activeHabitsForDate.length > 0
            ? Math.round((completedCount / activeHabitsForDate.length) * 100)
            : 0;

        return {
            date,
            habits: habitCheckIns,
            completionRate,
            totalHabits: activeHabitsForDate.length,
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
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('checkins')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error in getCheckInHistory:', error);
        throw error;
    }
}

// Get calendar data for month view
export async function getCalendarData(year, month) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        // Get user's habits
        const { data: habits, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (habitsError) throw habitsError;

        // Get check-ins for the month
        const { data: monthCheckIns, error: checkInsError } = await supabase
            .from('checkins')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (checkInsError) throw checkInsError;

        const calendarData = {};

        // Calculate completion rate for each day
        for (let date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const dayOfMonth = date.getDate();

            // Get habits that should be active on this specific date
            const activeHabitsForDay = habits.filter(habit => {
                const habitStartDate = new Date(habit.start_date);
                const habitEndDate = habit.end_date ? new Date(habit.end_date) : null;

                // Check if date is within habit's date range
                if (date < habitStartDate) return false;
                if (habitEndDate && date > habitEndDate) return false;

                if (habit.type === 'daily') return true;

                if (habit.type === 'weekly') {
                    return habit.frequency.some(freq => {
                        const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                        return habitDay === dayOfWeek;
                    });
                }

                if (habit.type === 'monthly') {
                    return habit.frequency.some(freq => freq.day === dayOfMonth);
                }

                return false;
            });

            const dayCheckIns = monthCheckIns?.filter(checkIn => checkIn.date === dateStr) || [];
            const completedCount = dayCheckIns.filter(checkIn => checkIn.completed).length;

            calendarData[dateStr] = activeHabitsForDay.length > 0
                ? Math.round((completedCount / activeHabitsForDay.length) * 100)
                : 0;
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
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const weekData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            try {
                const dayData = await getCheckInsForDate(dateStr);

                weekData.push({
                    date: dateStr,
                    completionRate: dayData.completionRate,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    completedHabits: dayData.completedHabits,
                    totalHabits: dayData.totalHabits
                });
            } catch (dayError) {
                console.error(`Error getting data for ${dateStr}:`, dayError);
                // Add empty data for failed days
                weekData.push({
                    date: dateStr,
                    completionRate: 0,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    completedHabits: 0,
                    totalHabits: 0
                });
            }
        }

        return weekData;
    } catch (error) {
        console.error('Error in getWeeklySummary:', error);
        return [];
    }
}

// Check for time conflicts on a specific date
export async function checkTimeConflicts(date) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Get user's active habits
        const { data: habits, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (error) throw error;

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();
        const dayOfMonth = targetDate.getDate();

        // Get habits active on this date
        const activeHabits = habits.filter(habit => {
            const habitStartDate = new Date(habit.start_date);
            const habitEndDate = habit.end_date ? new Date(habit.end_date) : null;

            // Check if date is within habit's date range
            if (targetDate < habitStartDate) return false;
            if (habitEndDate && targetDate > habitEndDate) return false;

            if (habit.type === 'daily') return true;

            if (habit.type === 'weekly') {
                return habit.frequency.some(freq => {
                    const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                    return habitDay === dayOfWeek;
                });
            }

            if (habit.type === 'monthly') {
                return habit.frequency.some(freq => freq.day === dayOfMonth);
            }

            return false;
        });

        // Group habits by start time
        const timeGroups = {};
        activeHabits.forEach(habit => {
            let startTime = null;

            if (habit.type === 'daily') {
                startTime = habit.frequency.startTime;
            } else if (habit.type === 'weekly') {
                const matchingFreq = habit.frequency.find(freq => {
                    const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                    return habitDay === dayOfWeek;
                });
                startTime = matchingFreq ? matchingFreq.startTime : null;
            } else if (habit.type === 'monthly') {
                const matchingFreq = habit.frequency.find(freq => freq.day === dayOfMonth);
                startTime = matchingFreq ? matchingFreq.startTime : null;
            }

            if (startTime) {
                if (!timeGroups[startTime]) {
                    timeGroups[startTime] = [];
                }
                timeGroups[startTime].push(habit);
            }
        });

        // Find conflicts (more than one habit at the same time)
        const conflicts = [];
        Object.entries(timeGroups).forEach(([time, habitsAtTime]) => {
            if (habitsAtTime.length > 1) {
                conflicts.push({
                    time,
                    habits: habitsAtTime
                });
            }
        });

        return conflicts;
    } catch (error) {
        console.error('Error checking time conflicts:', error);
        return [];
    }
}