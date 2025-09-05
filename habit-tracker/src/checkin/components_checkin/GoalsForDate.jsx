import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { getGoalsByUserID, getHabits, updateGoal } from "../../services/goalService";
import { getCheckInsForDate, checkInHabit } from "../../services/checkInService";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, ArrowRight } from "lucide-react";

// Displays goals and their linked habits for a selected date
const GoalsForDate = ({ selectedDate, onStatusChange, refreshTrigger }) => {
  const [goalsData, setGoalsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingHabits, setUpdatingHabits] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (selectedDate && isAuthenticated && user) {
      loadGoalsData(selectedDate);
    }
  }, [selectedDate, user, isAuthenticated, refreshTrigger]);

  const loadGoalsData = async (date) => {
    try {
      setLoading(true);

      const [allGoals, allHabits, checkIns] = await Promise.all([
        getGoalsByUserID(user.id),
        getHabits(user.id),
        getCheckInsForDate(date),
      ]);

      // Filter for goals that are active on the selected date
      const activeGoals = allGoals.filter((goal) => {
        const startDate = new Date(goal.start_date || goal.startDate);
        const deadline = new Date(goal.deadline);
        const currentDate = new Date(date);
        return currentDate >= startDate && currentDate <= deadline;
      });

      // Enrich active goals with linked habit details and check-in status
      const enrichedGoals = activeGoals.map((goal) => {
        // Only process auto goals with linked habits
        if (goal.type !== "auto" || !goal.linked_habits) {
          return {
            ...goal,
            linkedHabitsDetails: [],
          };
        }

        const linkedHabitsDetails = goal.linked_habits
          .map((habitId) => {
            const habit = allHabits.find(
              (h) => h.id.toString() === habitId.toString()
            );

            if (!habit) return null;

            const checkInStatus = checkIns.habits.find(
              (c) => c.habitId.toString() === habitId.toString()
            );

            // Check if the habit is scheduled for the selected date
            let isScheduledToday = false;
            const targetDate = new Date(date);
            const dayOfWeek = targetDate.getDay();
            const dayOfMonth = targetDate.getDate();

            if (habit.type === "daily") {
              isScheduledToday = true;
            } else if (habit.type === "weekly") {
              const habitDay = habit.frequency.find(
                (freq) => (freq.weekday === 7 ? 0 : freq.weekday) === dayOfWeek
              );
              isScheduledToday = !!habitDay;
            } else if (habit.type === "monthly") {
              const habitDay = habit.frequency.find(
                (freq) => freq.day === dayOfMonth
              );
              isScheduledToday = !!habitDay;
            }

            return {
              ...habit,
              completed: checkInStatus?.completed ?? false,
              checkInId: checkInStatus?.id,
              isScheduledToday,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const getStartTime = (h) => {
              if (h.type === 'daily' && h.frequency?.startTime) {
                return h.frequency.startTime;
              }
              if (h.type === 'weekly' && h.frequency?.length > 0 && h.frequency[0].startTime) {
                return h.frequency[0].startTime;
              }
              return null;
            };
            
            const timeA = getStartTime(a);
            const timeB = getStartTime(b);
            
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;
            
            const [ha, ma] = timeA.split(":").map(Number);
            const [hb, mb] = timeB.split(":").map(Number);
            return ha * 60 + ma - (hb * 60 + mb);
          });

        return {
          ...goal,
          linkedHabitsDetails,
        };
      });

      setGoalsData(enrichedGoals);
    } catch (error) {
      console.error("Failed to load goals data:", error);
      setGoalsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (
    habitId,
    completed,
    goalId,
    checkInId
  ) => {
    if (updatingHabits.has(habitId)) return;

    try {
      setUpdatingHabits((prev) => new Set([...prev, habitId]));

      // Update habit check-in status
      await checkInHabit(habitId, selectedDate, completed, "");

      // Update goal's currentValue
      const goalToUpdate = goalsData.find((g) => g.id === goalId);
      if (goalToUpdate && goalToUpdate.type === "auto") {
        const newCurrentValue = completed
          ? (goalToUpdate.current_value || goalToUpdate.currentValue || 0) + 1
          : Math.max(0, (goalToUpdate.current_value || goalToUpdate.currentValue || 0) - 1);

        // Update goal progress using Supabase service
        const updatedGoalData = {
          ...goalToUpdate,
          current_value: newCurrentValue,
          currentValue: newCurrentValue
        };
        await updateGoal(updatedGoalData);
      }

      // Optimistically update UI
      setGoalsData((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                current_value: completed
                  ? (goal.current_value || goal.currentValue || 0) + 1
                  : Math.max(0, (goal.current_value || goal.currentValue || 0) - 1),
                currentValue: completed
                  ? (goal.current_value || goal.currentValue || 0) + 1
                  : Math.max(0, (goal.current_value || goal.currentValue || 0) - 1),
                linkedHabitsDetails: goal.linkedHabitsDetails.map((h) =>
                  h.id.toString() === habitId.toString()
                    ? { ...h, completed }
                    : h
                ),
              }
            : goal
        )
      );

      // Trigger a refresh in the parent component
      if (onStatusChange) {
        onStatusChange(selectedDate);
      }
    } catch (error) {
      console.error("Failed to update habit and goal status:", error);
      // Revert UI on error
      setGoalsData((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                current_value: completed
                  ? Math.max(0, (goal.current_value || goal.currentValue || 0) - 1)
                  : (goal.current_value || goal.currentValue || 0) + 1,
                currentValue: completed
                  ? Math.max(0, (goal.current_value || goal.currentValue || 0) - 1)
                  : (goal.current_value || goal.currentValue || 0) + 1,
                linkedHabitsDetails: goal.linkedHabitsDetails.map((h) =>
                  h.id.toString() === habitId.toString()
                    ? { ...h, completed: !completed }
                    : h
                ),
              }
            : goal
        )
      );
    } finally {
      setUpdatingHabits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

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

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold" style={{ fontSize: "16px" }}>
            Goals for {formatDate(selectedDate)}
          </h5>
          <span className="text-muted small">
            {goalsData.length} goals active
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : goalsData && goalsData.length > 0 ? (
          goalsData.map((goal) => {
            const currentValue = goal.current_value || goal.currentValue || 0;
            const targetValue = goal.target_value || goal.targetValue || 1;
            const unit = goal.unit || '';
            const startDate = goal.start_date || goal.startDate;
            
            return (
              <div key={goal.id} className="goal-item mb-4 pb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6
                    className="mb-0 fw-medium me-2"
                    style={{ fontSize: "18px" }}
                  >
                    {goal.name}
                  </h6>
                  <Badge
                    bg={getPriorityColor(goal.priority)}
                    style={{ fontSize: "10px" }}
                  >
                    {goal.priority}
                  </Badge>
                </div>
                <p className="text-muted small mb-1">{goal.description}</p>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (currentValue / targetValue) * 100)}%`,
                    }}
                  ></div>
                  <div className="progress-bar-text">
                    {currentValue} / {targetValue} {unit}
                  </div>
                </div>
                <div className="d-flex align-items-center text-muted small mt-2">
                  <ArrowRight size={14} className="me-1" />
                  {new Date(startDate).toLocaleDateString()} -{" "}
                  {new Date(goal.deadline).toLocaleDateString()}
                </div>

                {goal.type === "auto" && goal.linkedHabitsDetails.length > 0 && (
                  <div className="linked-habits-container mt-3 pt-3">
                    <h6 className="mb-2 fw-semibold small text-primary mt-5">
                      Linked Habits:
                    </h6>
                    {goal.linkedHabitsDetails.map((habit) => (
                      <div
                        key={habit.id}
                        className="linked-habit-item d-flex align-items-center py-2"
                        style={{ borderBottom: "1px solid #f1f3f4" }}
                      >
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center">
                            <CheckCircle
                              size={16}
                              className={`me-2 ${
                                habit.completed ? "text-success" : "text-muted"
                              }`}
                            />
                            <span
                              className="text-dark me-2"
                              style={{ fontSize: "15px" }}
                            >
                              {habit.name}
                            </span>
                          </div>
                        </div>
                        {habit.isScheduledToday ? (
                          <Button
                            variant={habit.completed ? "success" : "outline-primary"}
                            size="sm"
                            onClick={() =>
                              handleToggleComplete(
                                habit.id,
                                !habit.completed,
                                goal.id,
                                habit.checkInId
                              )
                            }
                            disabled={updatingHabits.has(habit.id)}
                            className="rounded-pill px-3"
                          >
                            {updatingHabits.has(habit.id) ? (
                              <>
                                <div
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                                Updating...
                              </>
                            ) : habit.completed ? (
                              "✓ Completed"
                            ) : (
                              "Mark Complete"
                            )}
                          </Button>
                        ) : (
                          <span className="text-muted small">Not today</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-5">
            <h6 className="text-muted">No active goals found</h6>
            <p className="text-muted small mb-0">
              Create a goal or select a different date to see your progress!
            </p>
          </div>
        )}
      </Card.Body>
      <style jsx>{`
        .goal-item:last-child {
          border-bottom: none !important;
        }

        .linked-habits-container {
          border-top: 1px solid #e9ecef;
        }

        .progress-bar-container {
          position: relative;
          width: 100%;
          background-color: #e9ecef;
          border-radius: 50px;
          height: 20px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: #0d6efd;
          border-radius: 50px;
          transition: width 0.4s ease-in-out;
        }

        .progress-bar-text {
          position: absolute;
          width: 100%;
          text-align: center;
          line-height: 20px;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </Card>
  );
};

export default GoalsForDate;