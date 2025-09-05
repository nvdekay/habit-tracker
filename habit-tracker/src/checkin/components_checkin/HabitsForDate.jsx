import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Clock } from "lucide-react";
import {
  getCheckInsForDate,
  checkInHabit,
} from "../../services/checkInService";
import { getHabitsByUserId } from "../../services/habitService";
import { useAuth } from "../../context/AuthContext";

// Display list of habits for a specific date
const HabitsForDate = ({ selectedDate, onStatusChange, refreshTrigger }) => {
  // State containing data for the selected date (habits, completionRate,...)
  const [dayData, setDayData] = useState(null);

  // State to show loading when fetching data
  const [loading, setLoading] = useState(false);

  // State to store habits being updated (Set for easy management)
  const [updatingHabits, setUpdatingHabits] = useState(new Set());

  // Get user from AuthContext
  const { user, isAuthenticated } = useAuth();

  // useEffect runs again when selectedDate, user or refreshTrigger changes
  useEffect(() => {
    if (selectedDate && isAuthenticated && user) {
      // If there's a selected date and user is logged in
      loadDayData(selectedDate); // Call API to load data for that date
    }
  }, [selectedDate, user, isAuthenticated, refreshTrigger]);

  // Function to call API to get habits data for a specific date
  const loadDayData = async (date) => {
    try {
      setLoading(true); // Turn on loading state

      // Get check-ins for the day
      const checkInData = await getCheckInsForDate(date);

      // Get all habits to get time information
      const allHabits = await getHabitsByUserId(user.id);

      // Filter habits with isInGoals not true and enrich with time information
      const enrichedHabits = checkInData.habits
        .map((habit) => {
          const fullHabit = allHabits.find(
            (h) => h.id.toString() === habit.habitId.toString()
          );
          let startTime = null;

          if (fullHabit) {
            const targetDate = new Date(date);
            const dayOfWeek = targetDate.getDay();
            const dayOfMonth = targetDate.getDate();

            if (fullHabit.type === "daily") {
              startTime = fullHabit.frequency?.startTime;
            } else if (fullHabit.type === "weekly") {
              const todayFreq = fullHabit.frequency?.find?.((freq) => {
                const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                return habitDay === dayOfWeek;
              });
              startTime = todayFreq ? todayFreq.startTime : null;
            } else if (fullHabit.type === "monthly") {
              const todayFreq = fullHabit.frequency?.find?.((freq) => freq.day === dayOfMonth);
              startTime = todayFreq ? todayFreq.startTime : null;
            }
          }

          return {
            ...habit,
            startTime,
            endTime: fullHabit?.frequency?.endTime || null,
            priority: fullHabit?.priority || "medium",
            type: fullHabit?.type,
            isInGoals: fullHabit?.is_in_goals ?? false, 
            habitName: fullHabit?.name || habit.habitName, 
          };
        })
        .filter((habit) => habit.isInGoals !== true) 
        .sort((a, b) => {
          if (!a.startTime && !b.startTime) return 0;
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          const [ha, ma] = a.startTime.split(":").map(Number);
          const [hb, mb] = b.startTime.split(":").map(Number);
          return ha * 60 + ma - (hb * 60 + mb);
        });

      setDayData({
        ...checkInData,
        habits: enrichedHabits,
      });
    } catch (error) {
      console.error("Failed to load day data:", error);
      // If error, set default state (no habits)
      setDayData({ habits: [], completionRate: 0 });
    } finally {
      setLoading(false); // Turn off loading
    }
  };

  // Function to toggle completion status of a habit
  const handleToggleComplete = async (habitId, completed) => {
    if (updatingHabits.has(habitId)) return; // If this habit is being updated, skip

    try {
      // Add habitId to Set updatingHabits to disable button during update
      setUpdatingHabits((prev) => new Set([...prev, habitId]));

      // Call API to update habit status
      await checkInHabit(habitId, selectedDate, completed, "");

      // Update dayData state immediately on UI
      setDayData((prev) => {
        if (!prev) return prev;

        // Map habits again → update the toggled habit
        const updatedHabits = prev.habits.map((habit) =>
          habit.habitId.toString() === habitId.toString()
            ? { ...habit, completed }
            : habit
        );

        // Count completed habits
        const completedCount = updatedHabits.filter((h) => h.completed).length;

        // Calculate completion percentage
        const completionRate =
          updatedHabits.length > 0
            ? Math.round((completedCount / updatedHabits.length) * 100)
            : 0;

        // Return new object to update state
        return {
          ...prev,
          habits: updatedHabits,
          completionRate,
          completedHabits: completedCount,
        };
      });

      // If parent component passes callback, call it to notify of changes
      if (onStatusChange) {
        onStatusChange(selectedDate);
      }
    } catch (error) {
      console.error("Failed to update habit status:", error);
    } finally {
      // Remove habitId from updatingHabits set after completion
      setUpdatingHabits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  // Function to format date to mm/dd/yyyy format
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Function to format time
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Check if habit is due soon (within 30 minutes)
  const isHabitDueSoon = (startTime) => {
    if (!startTime) return false;

    const now = new Date();
    const today = new Date().toISOString().split("T")[0];

    // Only check for today
    if (selectedDate !== today) return false;

    const [hours, minutes] = startTime.split(":").map(Number);
    const habitTime = new Date();
    habitTime.setHours(hours, minutes, 0);

    const timeDiff = habitTime - now;
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 minutes
  };

  // JSX to render UI
  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold">
            Habits for {formatDate(selectedDate)}
          </h5>
          <Badge
            bg={
              dayData?.completionRate === 0
                ? "danger"
                : dayData?.completionRate === 100
                ? "success"
                : "warning"
            }
            className="rounded-pill px-3"
          >
            {dayData?.completionRate || 0}% Complete
          </Badge>
        </div>

        <p className="text-muted small mb-4">
          Habits are sorted by scheduled time (earliest first)
        </p>

        {/* Habits list */}
        <div className="habits-list">
          {dayData?.habits && dayData.habits.length > 0 ? (
            // If there are habits → map to list
            dayData.habits.map((habit) => (
              <div
                key={habit.habitId}
                className={`habit-item d-flex align-items-center py-3 ${
                  isHabitDueSoon(habit.startTime) && !habit.completed
                    ? "due-soon"
                    : ""
                }`}
                style={{ borderBottom: "1px solid #f1f3f4" }}
              >
                {/* Simple habit indicator */}
                <div
                  className="habit-indicator me-3"
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: habit.completed ? "#28a745" : "#e9ecef",
                    border: habit.completed ? "none" : "2px solid #6c757d",
                  }}
                />

                {/* Habit information */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <h6
                      className="mb-0 fw-medium me-2"
                      style={{ fontSize: "16px" }}
                    >
                      {habit.habitName}
                    </h6>
                    <Badge
                      bg={getPriorityColor(habit.priority)}
                      className="me-2"
                      style={{ fontSize: "10px" }}
                    >
                      {habit.priority}
                    </Badge>
                    {isHabitDueSoon(habit.startTime) && !habit.completed && (
                      <Badge bg="info" className="animate-pulse">
                        Due Soon!
                      </Badge>
                    )}
                  </div>

                  {habit.startTime && (
                    <div className="d-flex align-items-center text-muted small">
                      <Clock size={14} className="me-1" />
                      {formatTime(habit.startTime)}
                    </div>
                  )}
                </div>

                {/* Mark complete button */}
                <Button
                  variant={habit.completed ? "success" : "outline-secondary"}
                  size="sm"
                  onClick={() =>
                    handleToggleComplete(habit.habitId, !habit.completed)
                  }
                  disabled={updatingHabits.has(habit.habitId)}
                  className="rounded-pill px-3"
                >
                  {updatingHabits.has(habit.habitId) ? (
                    // If updating → show spinner
                    <>
                      <div
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                      >
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
            // If no habits → show empty message
            <div className="text-center py-5">
              <h6 className="text-muted">No habits found</h6>
              <p className="text-muted small mb-0">
                Create some habits to start tracking your progress!
              </p>
            </div>
          )}
        </div>
      </Card.Body>
      {/* Inline CSS for component */}
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

        .habit-item.due-soon {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding-left: 12px !important;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%,
          100% {
            background-color: #fff3cd;
          }
          50% {
            background-color: #ffeaa7;
          }
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .btn {
          transition: all 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .habit-indicator {
          transition: all 0.2s ease;
        }
      `}</style>
    </Card>
  );
};

export default HabitsForDate;