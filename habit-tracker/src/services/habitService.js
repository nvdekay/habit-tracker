// services/habitService.js - Cleaned version
import { supabase, handleSupabaseError, handleSupabaseSuccess } from './supabaseConfig';

// Get all habits for current user
export async function getHabits(userId = null) {
    try {
        let query = supabase
            .from('habits')
            .select('*')
            .order('created_at', { ascending: false });

        // If userId is provided, filter by user
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            // If no userId provided, get current user's habits
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return handleSupabaseSuccess(data);
    } catch (error) {
        return handleSupabaseError(error);
    }
}

// Get habits by user ID (specific function)
export async function getHabitsByUserId(userId) {
    try {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        throw error;
    }
}

// Create new habit
export async function createHabit(habitData) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Prepare habit data
        const newHabit = {
            user_id: user.id,
            name: habitData.name,
            description: habitData.description,
            type: habitData.type,
            frequency: habitData.frequency,
            start_date: habitData.startDate,
            end_date: habitData.endDate,
            priority: habitData.priority || 'medium',
            is_active: habitData.isActive !== false, // Default true
            is_in_goals: habitData.isInGoals || false
        };

        const { data, error } = await supabase
            .from('habits')
            .insert([newHabit])
            .select()
            .single();

        if (error) throw error;
        return handleSupabaseSuccess(data, 'Habit created successfully');
    } catch (error) {
        return handleSupabaseError(error);
    }
}

// Update existing habit
export async function updateHabit(habitId, habitData) {
    try {
        // Prepare update data, converting camelCase to snake_case
        const updateData = {
            name: habitData.name,
            description: habitData.description,
            type: habitData.type,
            frequency: habitData.frequency,
            start_date: habitData.startDate,
            end_date: habitData.endDate,
            priority: habitData.priority,
            is_active: habitData.isActive,
            is_in_goals: habitData.isInGoals,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const { data, error } = await supabase
            .from('habits')
            .update(updateData)
            .eq('id', habitId)
            .select()
            .single();

        if (error) throw error;
        return handleSupabaseSuccess(data, 'Habit updated successfully');
    } catch (error) {
        return handleSupabaseError(error);
    }
}

// Delete habit
export async function deleteHabit(habitId) {
    try {
        const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', habitId);

        if (error) throw error;
        return handleSupabaseSuccess(null, 'Habit deleted successfully');
    } catch (error) {
        return handleSupabaseError(error);
    }
}

// Get active habits for a user
export async function getActiveHabits(userId = null) {
    try {
        let query = supabase
            .from('habits')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (error) {
        throw error;
    }
}

// Get habits that should be active on a specific date
export async function getHabitsForDate(date, userId = null) {
    try {
        const habits = await getActiveHabits(userId);

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfMonth = targetDate.getDate();

        // Filter habits that should be active on this date
        const activeHabitsForDate = habits.filter(habit => {
            const startDate = new Date(habit.start_date);
            const endDate = habit.end_date ? new Date(habit.end_date) : null;

            // Check if date is within habit's date range
            if (targetDate < startDate) return false;
            if (endDate && targetDate > endDate) return false;

            // Check if habit should run on this day based on type
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

        return activeHabitsForDate;
    } catch (error) {
        throw error;
    }
}

// Bulk update habit status
export async function bulkUpdateHabits(habitIds, updates) {
    try {
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('habits')
            .update(updateData)
            .in('id', habitIds)
            .select();

        if (error) throw error;
        return handleSupabaseSuccess(data, 'Habits updated successfully');
    } catch (error) {
        return handleSupabaseError(error);
    }
}