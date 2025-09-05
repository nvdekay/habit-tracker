import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useAuth } from "../context/AuthContext";
import { getHabitsByUserId } from "../services/habitService";
import { getGoalsByUserID } from "../services/goalService";
import { getCheckInHistory } from "../services/checkInService";
import { supabase } from "../services/supabaseConfig";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register chart.js modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Dashboard API functions for Supabase
const dashboardAPI = {
    getDashboardData: async (userId) => {
        try {
            const [habits, goals, checkins, statistics] = await Promise.all([
                getHabitsByUserId(userId),
                getGoalsByUserID(userId),
                getCheckInHistory(
                    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
                    new Date().toISOString().split('T')[0] // Today
                ),
                getDashboardStatistics(userId)
            ]);

            return {
                success: true,
                data: {
                    habits: habits || [],
                    goals: goals || [],
                    checkins: checkins || [],
                    statistics: statistics || [],
                },
            };
        } catch (error) {
            console.error("Dashboard API Error:", error);
            return {
                success: false,
                message: error.message || "Failed to fetch dashboard data",
            };
        }
    },
};

// Get dashboard statistics from Supabase
const getDashboardStatistics = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('statistics')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(12); // Last 12 months

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Failed to fetch statistics:", error);
        return [];
    }
};

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        activeHabits: 0,
        completedToday: 0,
        todayCompletionRate: 0,
        longestStreak: 0,
        goalsProgress: { completed: 0, total: 0 },
        weeklyData: { labels: [], datasets: [] },
        monthlyData: { labels: [], datasets: [] },
    });
    const [topHabits, setTopHabits] = useState([]);

    useEffect(() => {
        if (isAuthenticated && user && user.id) {
            fetchDashboardData();
        }
    }, [user, isAuthenticated]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = user.id;
            const result = await dashboardAPI.getDashboardData(userId);

            if (!result.success) {
                throw new Error(result.message);
            }

            const { habits, goals, checkins, statistics } = result.data;
            calculateDashboardData(habits, goals, checkins, statistics);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const calculateDashboardData = (habits, goals, checkins, statistics) => {
        const today = new Date().toISOString().split("T")[0];

        // 1. Active Habits - handle both field name formats
        const activeHabits = habits.filter((habit) => 
            habit.is_active !== undefined ? habit.is_active : habit.isActive
        ).length;

        // 2. Completed Today
        const todayCheckins = checkins.filter(
            (checkin) => checkin.date === today && checkin.completed
        );
        const completedToday = todayCheckins.length;

        // 3. Completion Rate
        const todayCompletionRate =
            activeHabits > 0
                ? Math.round((completedToday / activeHabits) * 100)
                : 0;

        // 4. Longest Streak - calculate from habits data
        const longestStreak = habits.reduce((max, habit) => {
            // Calculate streak from checkins if not available in habit data
            const habitCheckins = checkins
                .filter(c => c.habit_id === habit.id && c.completed)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let currentStreak = 0;
            let maxStreak = 0;
            let lastDate = null;

            for (const checkin of habitCheckins) {
                const checkinDate = new Date(checkin.date);
                if (!lastDate || (lastDate - checkinDate) / (1000 * 60 * 60 * 24) === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
                lastDate = checkinDate;
            }

            return Math.max(max, maxStreak);
        }, 0);

        // 5. Goals Progress
        const completedGoals = goals.filter((goal) => goal.status === "completed").length;
        const totalGoals = goals.length;

        // 6. Weekly Completion Rate
        const weeklyCompletionData = calculateWeeklyCompletion(checkins, habits);

        // 7. Monthly Progress
        const monthlyProgressData = calculateMonthlyProgress(statistics, habits);

        // 8. Top Maintained Habits - calculate current streaks
        const habitsWithStreaks = habits
            .filter((h) => h.is_active !== undefined ? h.is_active : h.isActive)
            .map(habit => {
                // Calculate current streak from checkins
                const habitCheckins = checkins
                    .filter(c => c.habit_id === habit.id && c.completed)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                let currentStreak = 0;
                const today = new Date();
                
                for (const checkin of habitCheckins) {
                    const checkinDate = new Date(checkin.date);
                    const daysDiff = Math.floor((today - checkinDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff === currentStreak) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }

                return { ...habit, currentStreak };
            })
            .sort((a, b) => b.currentStreak - a.currentStreak)
            .slice(0, 4);

        setDashboardData({
            activeHabits,
            completedToday,
            todayCompletionRate,
            longestStreak,
            goalsProgress: { completed: completedGoals, total: totalGoals },
            weeklyData: weeklyCompletionData,
            monthlyData: monthlyProgressData,
        });
        setTopHabits(habitsWithStreaks);
    };

    const calculateWeeklyCompletion = (checkins, habits) => {
        const weeks = [];
        const weekLabels = [];
        const activeHabitsCount = habits.filter((h) => 
            h.is_active !== undefined ? h.is_active : h.isActive
        ).length;

        for (let i = 5; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekStartStr = weekStart.toISOString().split("T")[0];
            const weekEndStr = weekEnd.toISOString().split("T")[0];

            const weekCheckins = checkins.filter(
                (checkin) =>
                    checkin.date >= weekStartStr &&
                    checkin.date <= weekEndStr &&
                    checkin.completed
            );

            const expectedCheckins = activeHabitsCount * 7;
            const completionRate =
                expectedCheckins > 0
                    ? Math.round((weekCheckins.length / expectedCheckins) * 100)
                    : 0;

            weeks.push(Math.min(completionRate, 100));
            weekLabels.push(`Week ${6 - i}`);
        }

        return {
            labels: weekLabels,
            datasets: [
                {
                    label: "Completion Rate",
                    data: weeks,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.3)",
                    tension: 0.3,
                    fill: true,
                },
            ],
        };
    };

    const calculateMonthlyProgress = (statistics, habits) => {
        const months = statistics.slice(-5);

        if (months.length === 0) {
            // Create default data if no statistics available
            const completedHabits = habits.reduce((sum, h) => {
                // Count completed habits from checkins if available
                return sum + 1; // Simplified for now
            }, 0);

            return {
                labels: ["Current"],
                datasets: [
                    {
                        label: "Habits Completed",
                        data: [completedHabits],
                        backgroundColor: "#3b82f6",
                    },
                    {
                        label: "New Habits Added",
                        data: [habits.length],
                        backgroundColor: "#22c55e",
                    },
                ],
            };
        }

        const labels = months.map((stat) => {
            const date = new Date(stat.month + '-01'); // Add day to make valid date
            return date.toLocaleDateString("en-US", { month: "short" });
        });

        const completedData = months.map((stat) => stat.total_checkins || 0);
        const habitsCreatedData = months.map((stat) => stat.habits_created || 0);

        return {
            labels,
            datasets: [
                {
                    label: "Habits Completed",
                    data: completedData,
                    backgroundColor: "#3b82f6",
                },
                {
                    label: "New Habits Added",
                    data: habitsCreatedData,
                    backgroundColor: "#22c55e",
                },
            ],
        };
    };

    const weeklyOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
    };

    const monthlyOptions = {
        responsive: true,
        plugins: { legend: { position: "top" } },
    };

    const todayProgressData = {
        labels: ["Completed", "Remaining"],
        datasets: [
            {
                data: [
                    dashboardData.completedToday,
                    Math.max(dashboardData.activeHabits - dashboardData.completedToday, 0),
                ],
                backgroundColor: ["#3b82f6", "#ef4444"],
                hoverOffset: 4,
            },
        ],
    };

    // Loading state
    if (loading) {
        return (
            <div className="container py-4">
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "400px" }}
                >
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error loading dashboard data</h4>
                    <p>{error}</p>
                    <hr />
                    <p className="mb-0">
                        <button className="btn btn-outline-danger" onClick={fetchDashboardData}>
                            Try Again
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold">Welcome back, {user?.fullName || user?.full_name || "User"}!</h2>
                    <p className="fs-6">Track your habits and achieve your goals</p>
                </div>
                <div>
                    <button
                        className="btn btn-outline-primary ms-2"
                        onClick={fetchDashboardData}
                        title="Refresh data"
                        disabled={loading}
                    >
                        {loading ? (
                            <span
                                className="spinner-border spinner-border-sm me-1"
                                role="status"
                                aria-hidden="true"
                            ></span>
                        ) : (
                            <i className="bi bi-arrow-clockwise me-1"></i>
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card shadow-sm p-3" style={{ backgroundColor: "#FFF3E0" }}>
                        <h6 className="mb-2">Active Habits</h6>
                        <h4 className="mb-0">{dashboardData.activeHabits}</h4>
                        <p className="mb-0 small">Total habits tracked</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm p-3" style={{ backgroundColor: "#d1fae5" }}>
                        <h6 className="text-muted mb-2">Completed Today</h6>
                        <h4 className="mb-0">{dashboardData.completedToday}</h4>
                        <p className="text-muted mb-0 small">
                            {dashboardData.todayCompletionRate}% completion rate
                        </p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm p-3" style={{ backgroundColor: "#f3e8ff" }}>
                        <h6 className="text-muted mb-2">Longest Streak</h6>
                        <h4 className="mb-0">{dashboardData.longestStreak}</h4>
                        <p className="text-muted mb-0 small">days in a row</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm p-3" style={{ backgroundColor: "#e0f2fe" }}>
                        <h6 className="text-muted mb-2">Goals Progress</h6>
                        <h4 className="mb-0">
                            {dashboardData.goalsProgress.completed}/{dashboardData.goalsProgress.total}
                        </h4>
                        <p className="text-muted mb-0 small">goals completed</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm p-3">
                        <h6 className="mb-2">Weekly Completion Rate</h6>
                        <p className="text-muted small mb-3">
                            Your habit completion rate over the past 6 weeks
                        </p>
                        <div style={{ height: "300px" }}>
                            <Line data={dashboardData.weeklyData} options={weeklyOptions} />
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm p-3">
                        <h6 className="mb-2">Monthly Progress</h6>
                        <p className="text-muted small mb-3">
                            Habits completed and new habits added each month
                        </p>
                        <div style={{ height: "300px" }}>
                            <Bar data={dashboardData.monthlyData} options={monthlyOptions} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra Section */}
            <div className="row mt-4">
                {/* Top Maintained Habits */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm p-3 h-100">
                        <h6 className="mb-2">Top Maintained Habits</h6>
                        <p className="text-muted small mb-3">
                            Your habits with the longest streaks
                        </p>
                        <ul className="list-unstyled">
                            {topHabits.map((habit, index) => (
                                <li
                                    key={habit.id}
                                    className="d-flex justify-content-between align-items-center mb-3"
                                >
                                    <div>
                                        <strong>{habit.name}</strong>
                                        <div className="text-muted small">
                                            {habit.currentStreak} day streak
                                        </div>
                                    </div>
                                    <span
                                        className="badge rounded-pill"
                                        style={{
                                            backgroundColor: ["#ef4444", "#3b82f6", "#06b6d4", "#a855f7"][
                                                index
                                            ],
                                        }}
                                    >
                                        #{index + 1}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Today's Progress */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm p-3 h-100">
                        <h6 className="mb-2">Today's Progress</h6>
                        <p className="text-muted small mb-3">
                            Breakdown of today's habit completion
                        </p>
                        <div style={{ height: "300px" }}>
                            <Doughnut data={todayProgressData} />
                        </div>
                        <div className="d-flex justify-content-center mt-3">
                            <span className="me-3 text-primary small">
                                ● Completed ({dashboardData.completedToday})
                            </span>
                            <span className="text-danger small">
                                ● Remaining (
                                {Math.max(
                                    dashboardData.activeHabits - dashboardData.completedToday,
                                    0
                                )}
                                )
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}