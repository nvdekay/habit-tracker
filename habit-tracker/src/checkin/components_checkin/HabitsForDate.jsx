import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { TrendingUp } from 'lucide-react';
import { getCheckInsForDate, checkInHabit } from '../../services/checkInService';
import { useAuth } from '../../context/AuthContext';

const HabitsForDate = ({ selectedDate, onStatusChange, refreshTrigger }) => {
    const [dayData, setDayData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingHabits, setUpdatingHabits] = useState(new Set());
    const { user } = useAuth();

    useEffect(() => {
        if (selectedDate && user) {
            loadDayData(selectedDate);
        }
    }, [selectedDate, user, refreshTrigger]);

    const loadDayData = async (date) => {
        try {
            setLoading(true);
            const data = await getCheckInsForDate(date);
            setDayData(data);
        } catch (error) {
            console.error('Failed to load day data:', error);
            setDayData({ habits: [], completionRate: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (habitId, completed) => {
        if (updatingHabits.has(habitId)) return;

        try {
            setUpdatingHabits(prev => new Set([...prev, habitId]));

            await checkInHabit(habitId, selectedDate, completed, '');

            setDayData(prev => {
                if (!prev) return prev;

                const updatedHabits = prev.habits.map(habit =>
                    habit.habitId.toString() === habitId.toString()
                        ? { ...habit, completed }
                        : habit
                );

                const completedCount = updatedHabits.filter(h => h.completed).length;
                const completionRate = updatedHabits.length > 0
                    ? Math.round((completedCount / updatedHabits.length) * 100)
                    : 0;

                return {
                    ...prev,
                    habits: updatedHabits,
                    completionRate,
                    completedHabits: completedCount
                };
            });

            if (onStatusChange) {
                onStatusChange(selectedDate);
            }
        } catch (error) {
            console.error('Failed to update habit status:', error);
        } finally {
            setUpdatingHabits(prev => {
                const newSet = new Set(prev);
                newSet.delete(habitId);
                return newSet;
            });
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getHabitIconStyle = (color) => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: color || '#6c757d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        marginRight: '16px'
    });

    // if (loading) {
    //     return (
    //         <Card className="shadow-sm border-0">
    //             <Card.Body className="p-4">
    //                 <div className="text-center py-4">
    //                     <div className="spinner-border text-primary mb-3" role="status">
    //                         <span className="visually-hidden">Loading...</span>
    //                     </div>
    //                     <p className="text-muted mb-0">Loading habits...</p>
    //                 </div>
    //             </Card.Body>
    //         </Card>
    //     );
    // }

    return (
        <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0 fw-semibold">
                        Habits for {formatDate(selectedDate)}
                    </h5>
                    <Badge
                        bg={dayData?.completionRate === 0 ? 'danger' : dayData?.completionRate === 100 ? 'success' : 'warning'}
                        className="rounded-pill px-3"
                    >
                        {dayData?.completionRate || 0}% Complete
                    </Badge>
                </div>

                <p className="text-muted small mb-4">View or update past check-ins</p>

                {/* Habits List */}
                <div className="habits-list">
                    {dayData?.habits && dayData.habits.length > 0 ? (
                        dayData.habits.map((habit) => (
                            <div
                                key={habit.habitId}
                                className="habit-item d-flex align-items-center py-3"
                                style={{ borderBottom: '1px solid #f1f3f4' }}
                            >
                                {/* Habit Icon */}
                                <div style={getHabitIconStyle(habit.habitColor)}>
                                    {habit.habitIcon || 'icon'}
                                </div>

                                {/* Habit Info */}
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 fw-medium" style={{ fontSize: '16px' }}>
                                        {habit.habitName}
                                    </h6>
                                    {habit.streak > 0 && (
                                        <div className="d-flex align-items-center">
                                            <TrendingUp size={14} className="me-1" style={{ color: '#6c757d' }} />
                                            <span className="small text-muted">
                                                {habit.streak} day streak
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Mark Complete Button */}
                                <Button
                                    variant={habit.completed ? "success" : "outline-secondary"}
                                    size="sm"
                                    onClick={() => handleToggleComplete(habit.habitId, !habit.completed)}
                                    disabled={updatingHabits.has(habit.habitId)}
                                    className="rounded-pill px-3"
                                >
                                    {updatingHabits.has(habit.habitId) ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-1" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Updating...
                                        </>
                                    ) : habit.completed ? (
                                        "✓ Completed"
                                    ) : (
                                        "Mark Complete"
                                    )}
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <div className="text-muted mb-3">
                                <div style={{ fontSize: '48px', opacity: 0.3 }}>Icon</div>
                            </div>
                            <h6 className="text-muted">No habits found</h6>
                            <p className="text-muted small mb-0">
                                Create some habits to start tracking your progress!
                            </p>
                        </div>
                    )}
                </div>
            </Card.Body>

            <style jsx>{`
                .habit-item:last-child {
                    border-bottom: none !important;
                }

                .habit-item:hover {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    margin: 0 -16px;
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }

                .btn {
                    transition: all 0.2s ease;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }
            `}</style>
        </Card>
    );
};

export default HabitsForDate;