const BASE_URL = "http://localhost:8080";

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
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const today = new Date().toISOString().split('T')[0];

        // Get user's active habits
        const habitsResponse = await fetch(`${BASE_URL}/habits?userId=${userId}&isActive=true`);
        if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
        const habits = await habitsResponse.json();

        // Get today's check-ins
        const checkInsResponse = await fetch(`${BASE_URL}/checkins?userId=${userId}&date=${today}`);
        if (!checkInsResponse.ok) throw new Error('Failed to fetch check-ins');
        const checkIns = await checkInsResponse.json();

        // Filter habits that should be notified
        const upcomingHabits = habits
            .filter(habit => {
                // Check if habit should be notified based on time
                if (!shouldNotifyHabit(habit)) return false;
                
                // Check if habit is already completed today
                const existingCheckIn = checkIns.find(ci => 
                    ci.habitId.toString() === habit.id.toString() && ci.completed
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
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');

        const targetDate = date || new Date().toISOString().split('T')[0];
        
        // Get user's active habits
        const habitsResponse = await fetch(`${BASE_URL}/habits?userId=${userId}&isActive=true`);
        if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
        const habits = await habitsResponse.json();

        // Get habits that are active on the target date
        const dayOfWeek = new Date(targetDate).getDay();
        const dayOfMonth = new Date(targetDate).getDate();
        
        const activeHabits = habits.filter(habit => {
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