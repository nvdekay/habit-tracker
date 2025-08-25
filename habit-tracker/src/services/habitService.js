// habitService.js - Updated version
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

// Get habits with filters and pagination
export async function getHabits(filters = {}, page = 1, limit = 10) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        let url = `${BASE_URL}/habits?userId=${userId}`;

        // Add filters
        if (filters.isActive !== undefined) {
            url += `&isActive=${filters.isActive}`;
        }
        if (filters.type) {
            url += `&type=${filters.type}`;
        }
        if (filters.priority) {
            url += `&priority=${filters.priority}`;
        }

        // Add pagination
        const startIndex = (page - 1) * limit;
        url += `&_start=${startIndex}&_limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch habits');
        }

        const habits = await response.json();

        return {
            habits: habits,
            total: habits.length,
            page: page,
            limit: limit
        };
    } catch (error) {
        console.error('Error in getHabits:', error);
        throw error;
    }
}

// Get habit by ID
export async function getHabitById(id) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const response = await fetch(`${BASE_URL}/habits/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch habit');
        }
        
        const habit = await response.json();
        
        // Check if habit belongs to current user
        if (habit.userId !== userId) {
            throw new Error('Unauthorized access to habit');
        }
        
        return habit;
    } catch (error) {
        console.error('Error in getHabitById:', error);
        throw error;
    }
}

// Create new habit
export async function createHabit(habitData) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const newHabit = {
            ...habitData,
            userId: userId,
            isActive: true,
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await fetch(`${BASE_URL}/habits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newHabit)
        });

        if (!response.ok) {
            throw new Error('Failed to create habit');
        }

        return response.json();
    } catch (error) {
        console.error('Error in createHabit:', error);
        throw error;
    }
}

// Update habit
export async function updateHabit(id, updates) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // First verify the habit belongs to current user
        const habit = await getHabitById(id);
        if (!habit) throw new Error('Habit not found');

        const response = await fetch(`${BASE_URL}/habits/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...updates,
                updatedAt: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update habit');
        }

        return response.json();
    } catch (error) {
        console.error('Error in updateHabit:', error);
        throw error;
    }
}

// Delete habit
export async function deleteHabit(id) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // First verify the habit belongs to current user
        const habit = await getHabitById(id);
        if (!habit) throw new Error('Habit not found');

        const response = await fetch(`${BASE_URL}/habits/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete habit');
        }

        return true;
    } catch (error) {
        console.error('Error in deleteHabit:', error);
        throw error;
    }
}

// Get active habits for current user
export async function getActiveHabits() {
    try {
        const result = await getHabits({ isActive: true }, 1, 100);
        return result.habits;
    } catch (error) {
        console.error('Error in getActiveHabits:', error);
        throw error;
    }
}

// Update habit streak information
export async function updateHabitStreak(habitId, currentStreak, longestStreak, totalCompletions) {
    try {
        const updates = {
            currentStreak,
            longestStreak,
            totalCompletions
        };

        return await updateHabit(habitId, updates);
    } catch (error) {
        console.error('Error in updateHabitStreak:', error);
        throw error;
    }
}

// Get habits with their icons and colors for display
export async function getHabitsForDisplay() {
    try {
        const habits = await getActiveHabits();
        
        // Add default icons and colors if not provided
        return habits.map(habit => ({
            ...habit,
            icon: habit.icon,
            color: habit.color || '#6c757d'
        }));
    } catch (error) {
        console.error('Error in getHabitsForDisplay:', error);
        throw error;
    }
}

// Get habit statistics
export async function getHabitStats(habitId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        // Get habit details
        const habit = await getHabitById(habitId);
        
        // Get all check-ins for this habit
        const checkInsResponse = await fetch(`${BASE_URL}/checkins?userId=${userId}&habitId=${habitId}`);
        if (!checkInsResponse.ok) throw new Error('Failed to fetch check-ins');
        
        const checkIns = await checkInsResponse.json();
        const completedCheckIns = checkIns.filter(checkIn => checkIn.completed);
        
        // Calculate statistics
        const totalDays = checkIns.length;
        const completedDays = completedCheckIns.length;
        const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        
        // Get recent streak info
        const today = new Date().toISOString().split('T')[0];
        const recentCheckIns = checkIns
            .filter(checkIn => checkIn.date <= today)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let currentStreak = 0;
        for (const checkIn of recentCheckIns) {
            if (checkIn.completed) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            habit,
            totalDays,
            completedDays,
            completionRate,
            currentStreak,
            longestStreak: habit.longestStreak || 0,
            recentActivity: recentCheckIns.slice(0, 7) // Last 7 days
        };
    } catch (error) {
        console.error('Error in getHabitStats:', error);
        throw error;
    }
}