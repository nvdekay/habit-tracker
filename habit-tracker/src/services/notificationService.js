// services/notificationService.js
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

// Check if a habit should be notified based on current time
const shouldNotifyHabit = (habit) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Helper function to convert time string to minutes
    const timeToMinutes = (timeString) => {
        if (!timeString) return null;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    // Check if current time is within 2 hours before habit time
    const isWithinNotificationWindow = (startTime) => {
        const habitTimeMinutes = timeToMinutes(startTime);
        if (habitTimeMinutes === null) return false;
        
        // Check if habit time is within next 2 hours (120 minutes)
        const timeDiff = habitTimeMinutes - currentTime;
        return timeDiff > 0 && timeDiff <= 120;
    };

    if (habit.type === 'daily') {
        // For daily habits, check if current time is within notification window
        return isWithinNotificationWindow(habit.frequency.startTime);
    } else if (habit.type === 'weekly') {
        // For weekly habits, check if today matches any of the scheduled days
        return habit.frequency.some(freq => {
            const habitDay = freq.weekday === 7 ? 0 : freq.weekday; // Convert Sunday from 7 to 0
            return habitDay === currentDay && isWithinNotificationWindow(freq.startTime);
        });
    } else if (habit.type === 'monthly') {
        // For monthly habits, check if today matches the scheduled day
        const today = now.getDate();
        return habit.frequency.some(freq => {
            return freq.day === today && isWithinNotificationWindow(freq.startTime);
        });
    }
    
    return false;
};

// Get the next occurrence time for a habit
const getHabitTime = (habit) => {
    const now = new Date();
    const currentDay = now.getDay();
    
    if (habit.type === 'daily') {
        return habit.frequency.startTime;
    } else if (habit.type === 'weekly') {
        // Find the frequency that matches today
        const todayFreq = habit.frequency.find(freq => {
            const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
            return habitDay === currentDay;
        });
        return todayFreq ? todayFreq.startTime : null;
    } else if (habit.type === 'monthly') {
        const today = now.getDate();
        const todayFreq = habit.frequency.find(freq => freq.day === today);
        return todayFreq ? todayFreq.startTime : null;
    }
    
    return null;
};

// Get habits that should trigger notifications
export const getUpcomingHabits = async () => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const today = new Date().toISOString().split('T')[0];

        // Get user's active habits
        const { data: habits, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (habitsError) throw habitsError;

        // Get today's check-ins
        const { data: checkIns, error: checkInsError } = await supabase
            .from('checkins')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today);

        if (checkInsError) throw checkInsError;

        // Filter habits that should be notified
        const upcomingHabits = habits
            .filter(habit => {
                // Check if habit should be notified based on time
                if (!shouldNotifyHabit(habit)) return false;
                
                // Check if habit is already completed today
                const existingCheckIn = checkIns?.find(ci => 
                    ci.habit_id === habit.id && ci.completed
                );
                
                return !existingCheckIn; // Only notify if not completed
            })
            .map(habit => ({
                habitId: habit.id,
                habitName: habit.name,
                habitDescription: habit.description,
                startTime: getHabitTime(habit),
                priority: habit.priority,
                date: today
            }))
            .filter(habit => habit.startTime !== null) // Remove habits without valid time
            .sort((a, b) => {
                // Sort by time (earliest first)
                const timeA = a.startTime.split(':').map(Number);
                const timeB = b.startTime.split(':').map(Number);
                const minutesA = timeA[0] * 60 + timeA[1];
                const minutesB = timeB[0] * 60 + timeB[1];
                return minutesA - minutesB;
            });

        return upcomingHabits;
    } catch (error) {
        console.error('Error getting upcoming habits:', error);
        return [];
    }
};

// Check for time conflicts between habits
export const checkTimeConflicts = async (date = null) => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const targetDate = date || new Date().toISOString().split('T')[0];
        
        // Get user's active habits
        const { data: habits, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (error) throw error;

        // Get habits that are active on the target date
        const dayOfWeek = new Date(targetDate).getDay();
        const dayOfMonth = new Date(targetDate).getDate();
        
        const activeHabits = habits.filter(habit => {
            const habitStartDate = new Date(habit.start_date);
            const habitEndDate = habit.end_date ? new Date(habit.end_date) : null;
            const checkDate = new Date(targetDate);
            
            // Check if date is within habit's date range
            if (checkDate < habitStartDate) return false;
            if (habitEndDate && checkDate > habitEndDate) return false;

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

        // Group habits by time
        const timeGroups = {};
        activeHabits.forEach(habit => {
            const time = getHabitTime(habit);
            if (time) {
                if (!timeGroups[time]) {
                    timeGroups[time] = [];
                }
                timeGroups[time].push(habit);
            }
        });

        // Find conflicts (more than one habit at the same time)
        const conflicts = Object.entries(timeGroups)
            .filter(([time, habitsAtTime]) => habitsAtTime.length > 1)
            .map(([time, habitsAtTime]) => ({
                time,
                habits: habitsAtTime
            }));

        return conflicts;
    } catch (error) {
        console.error('Error checking time conflicts:', error);
        return [];
    }
};

// Get notification count for badge
export const getNotificationCount = async () => {
    try {
        const upcomingHabits = await getUpcomingHabits();
        return upcomingHabits.length;
    } catch (error) {
        console.error('Error getting notification count:', error);
        return 0;
    }
};

// Create/Update reminder for a habit
export const createReminder = async (habitId, reminderData) => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('reminders')
            .insert([{
                user_id: userId,
                habit_id: habitId,
                time: reminderData.time,
                enabled: reminderData.enabled !== false,
                days: reminderData.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                message: reminderData.message || 'Time for your habit!'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating reminder:', error);
        throw error;
    }
};

// Get reminders for a user
export const getReminders = async (userId = null) => {
    try {
        const targetUserId = userId || await getCurrentUserId();
        if (!targetUserId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('reminders')
            .select(`
                *,
                habits (
                    id,
                    name,
                    description
                )
            `)
            .eq('user_id', targetUserId)
            .eq('enabled', true);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting reminders:', error);
        return [];
    }
};

// Update reminder
export const updateReminder = async (reminderId, updates) => {
    try {
        const { data, error } = await supabase
            .from('reminders')
            .update(updates)
            .eq('id', reminderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating reminder:', error);
        throw error;
    }
};

// Delete reminder
export const deleteReminder = async (reminderId) => {
    try {
        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', reminderId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting reminder:', error);
        throw error;
    }
};