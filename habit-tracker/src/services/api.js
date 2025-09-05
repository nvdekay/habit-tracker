// api.js - Cleaned version
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentUserId } from './supabaseConfig';

// API utility functions for common operations
export const api = {
    // Get data with optional filters and pagination
    async getData(table, options = {}) {
        try {
            let query = supabase.from(table).select('*');

            // Apply filters
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    if (value !== null && value !== undefined && value !== 'all') {
                        query = query.eq(key, value);
                    }
                });
            }

            // Apply user filter if needed
            if (options.userFilter !== false) {
                const userId = await getCurrentUserId();
                if (userId) {
                    query = query.eq('user_id', userId);
                }
            }

            // Apply sorting
            if (options.orderBy) {
                query = query.order(options.orderBy, {
                    ascending: options.ascending !== false
                });
            }

            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;
            if (error) throw error;

            return handleSupabaseSuccess(data);

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Create new record
    async createData(table, data) {
        try {
            // Add user_id if not present
            if (!data.user_id && table !== 'users') {
                const userId = await getCurrentUserId();
                if (userId) {
                    data.user_id = userId;
                }
            }

            // Add timestamps
            data.created_at = new Date().toISOString();
            data.updated_at = new Date().toISOString();

            const { data: result, error } = await supabase
                .from(table)
                .insert([data])
                .select()
                .single();

            if (error) throw error;
            return handleSupabaseSuccess(result, 'Created successfully');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Update existing record
    async updateData(table, id, updates) {
        try {
            // Add update timestamp
            updates.updated_at = new Date().toISOString();

            // Remove undefined fields
            Object.keys(updates).forEach(key => {
                if (updates[key] === undefined) {
                    delete updates[key];
                }
            });

            const { data, error } = await supabase
                .from(table)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return handleSupabaseSuccess(data, 'Updated successfully');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Delete record
    async deleteData(table, id) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return handleSupabaseSuccess(null, 'Deleted successfully');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Get single record by ID
    async getById(table, id) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return handleSupabaseSuccess(data);

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Bulk operations
    async bulkCreate(table, dataArray) {
        try {
            const userId = await getCurrentUserId();
            const timestamp = new Date().toISOString();

            // Add user_id and timestamps to all records
            const enrichedData = dataArray.map(item => ({
                ...item,
                user_id: item.user_id || userId,
                created_at: timestamp,
                updated_at: timestamp
            }));

            const { data, error } = await supabase
                .from(table)
                .insert(enrichedData)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data, 'Bulk create successful');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    async bulkUpdate(table, updates, filters) {
        try {
            updates.updated_at = new Date().toISOString();

            let query = supabase.from(table).update(updates);

            // Apply filters
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            const { data, error } = await query.select();
            if (error) throw error;

            return handleSupabaseSuccess(data, 'Bulk update successful');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    async bulkDelete(table, ids) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .in('id', ids);

            if (error) throw error;
            return handleSupabaseSuccess(null, 'Bulk delete successful');

        } catch (error) {
            return handleSupabaseError(error);
        }
    }
};

// Specific API functions
export const specificAPI = {
    // Get user profile with preferences
    async getUserProfile(userId = null) {
        try {
            const targetUserId = userId || await getCurrentUserId();
            if (!targetUserId) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, full_name, avatar, preferences, created_at, updated_at')
                .eq('id', targetUserId)
                .single();

            if (error) throw error;
            return handleSupabaseSuccess(data);

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Update user preferences
    async updateUserPreferences(preferences) {
        try {
            const userId = await getCurrentUserId();
            if (!userId) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('users')
                .update({
                    preferences,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return handleSupabaseSuccess(data, 'Preferences updated');

        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    // Get dashboard stats
    async getDashboardStats() {
        try {
            const userId = await getCurrentUserId();
            if (!userId) throw new Error('User not authenticated');

            // Get counts for different entities
            const [habitsResult, goalsResult, checkinsResult] = await Promise.all([
                supabase.from('habits').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_active', true),
                supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId),
                supabase.from('checkins').select('id', { count: 'exact' }).eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0])
            ]);

            const stats = {
                activeHabits: habitsResult.count || 0,
                totalGoals: goalsResult.count || 0,
                todayCheckins: checkinsResult.count || 0
            };

            return handleSupabaseSuccess(stats);

        } catch (error) {
            return handleSupabaseError(error);
        }
    }
};

// Export everything
export default api;
export { supabase } from './supabaseConfig';