// services/goalService.js - Cleaned version
import { supabase, handleSupabaseError, handleSupabaseSuccess } from './supabaseConfig';

// Get all goals for a user
export const getGoalsByUserID = async (userId = null) => {
    try {
        let query = supabase
            .from('goals')
            .select('*')
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
};

// Get habits for a user (used in goals)
export const getHabits = async (userId = null) => {
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
};

// Update an existing goal
export async function updateGoal(goal) {
    try {
        const updateData = {
            name: goal.name,
            description: goal.description,
            target_value: goal.targetValue,
            current_value: goal.currentValue,
            unit: goal.unit,
            start_date: goal.startDate,
            deadline: goal.deadline,
            priority: goal.priority,
            status: goal.status,
            linked_habits: goal.linkedHabits,
            type: goal.type,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const { data, error } = await supabase
            .from('goals')
            .update(updateData)
            .eq('id', goal.id)
            .select()
            .single();

        if (error) throw error;
        return { data, status: 200 };
    } catch (error) {
        throw error;
    }
}

// Delete a goal
export async function deleteGoal(goalId) {
    try {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId);

        if (error) throw error;
        return { data: true };
    } catch (error) {
        throw error;
    }
}

// Create a new goal
export async function createGoal(newGoal) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const goalData = {
            user_id: user.id,
            name: newGoal.name,
            description: newGoal.description,
            target_value: newGoal.targetValue,
            current_value: newGoal.currentValue || 0,
            unit: newGoal.unit,
            start_date: newGoal.startDate,
            deadline: newGoal.deadline,
            priority: newGoal.priority,
            status: newGoal.status || 'in_progress',
            linked_habits: newGoal.linkedHabits || [],
            type: newGoal.type
        };

        const { data, error } = await supabase
            .from('goals')
            .insert([goalData])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
}

// Calculate habit target based on frequency and date range
export function calculateHabitTarget(habit, goalStartDate, goalEndDate) {
    const start = new Date(goalStartDate);
    const end = new Date(goalEndDate);

    if (habit.type === "daily") {
        const habitStart = new Date(habit.start_date);
        const habitEnd = habit.end_date ? new Date(habit.end_date) : new Date('2099-12-31');
        const s = start > habitStart ? start : habitStart;
        const e = end < habitEnd ? end : habitEnd;
        const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(0, days);
    }

    if (habit.type === "weekly") {
        const habitStart = new Date(habit.start_date);
        const habitEnd = habit.end_date ? new Date(habit.end_date) : new Date('2099-12-31');
        const s = start > habitStart ? start : habitStart;
        const e = end < habitEnd ? end : habitEnd;
        let count = 0;
        const weekdays = habit.frequency.map((f) => f.weekday); // [1..7]

        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // JS: 0=Sun..6=Sat
            if (weekdays.includes(dayOfWeek)) count++;
        }
        return count;
    }

    if (habit.type === "monthly") {
        const habitStart = new Date(habit.start_date);
        const habitEnd = habit.end_date ? new Date(habit.end_date) : new Date('2099-12-31');
        const s = start > habitStart ? start : habitStart;
        const e = end < habitEnd ? end : habitEnd;
        let count = 0;
        const daysOfMonth = habit.frequency.map((f) => f.day); // [1..31]

        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            if (daysOfMonth.includes(d.getDate())) count++;
        }
        return count;
    }

    return 0;
}

// Get goals for a specific date
export const getGoalsForDate = async (userId, date) => {
    try {
        const { data: goals, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'auto')
            .neq('status', 'completed');

        if (error) throw error;
        return goals || [];
    } catch (error) {
        return [];
    }
};

// Update goal status
export const updateGoalStatus = async (goalId, newStatus) => {
    try {
        const { data, error } = await supabase
            .from('goals')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', goalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

// Get goals with filters
export const getGoalsWithFilters = async (userId, filters = {}) => {
    try {
        let query = supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId);

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
            query = query.eq('priority', filters.priority);
        }

        if (filters.type && filters.type !== 'all') {
            query = query.eq('type', filters.type);
        }

        // Apply sorting
        if (filters.sortBy) {
            const ascending = filters.sortOrder === 'asc';
            
            switch (filters.sortBy) {
                case 'deadline':
                    query = query.order('deadline', { ascending, nullsLast: true });
                    break;
                case 'createdDate':
                    query = query.order('created_at', { ascending });
                    break;
                case 'priority':
                    query = query.order('priority', { ascending });
                    break;
                default:
                    query = query.order(filters.sortBy, { ascending });
            }
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (error) {
        throw error;
    }
};

// Bulk update goals
export const bulkUpdateGoals = async (goalIds, updates) => {
    try {
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('goals')
            .update(updateData)
            .in('id', goalIds)
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};