import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Clock } from "lucide-react";
import {
  getCheckInsForDate,
  checkInHabit,
} from "../../services/checkInService";
import { getHabits } from "../../services/habitService";
import { useAuth } from "../../context/AuthContext";

// Hiển thị danh sách thói quen của một ngày
const HabitsForDate = ({ selectedDate, onStatusChange, refreshTrigger }) => {
  // State chứa dữ liệu của ngày được chọn (habits, completionRate,...)
  const [dayData, setDayData] = useState(null);

  // State để hiển thị loading khi fetch data
  const [loading, setLoading] = useState(false);

  // State để lưu các habit đang được update (Set để dễ quản lý)
  const [updatingHabits, setUpdatingHabits] = useState(new Set());

  // Lấy user từ AuthContext
  const { user } = useAuth();

  // useEffect chạy lại khi selectedDate, user hoặc refreshTrigger thay đổi
  useEffect(() => {
    if (selectedDate && user) {
      // Nếu có ngày được chọn và user đã login
      loadDayData(selectedDate); // Gọi API load data cho ngày đó
    }
  }, [selectedDate, user, refreshTrigger]);

  // Hàm gọi API để lấy dữ liệu habits của một ngày
  const loadDayData = async (date) => {
    try {
      setLoading(true); // Bật trạng thái loading

      // Get check-ins for the day
      const checkInData = await getCheckInsForDate(date);

      // Get all habits to get time information
      const habitsResponse = await fetch(
        `http://localhost:8080/habits?userId=${user.id}&isActive=true`
      );
      const allHabits = await habitsResponse.json();

      // Lọc habit có isInGoals khác true và enrich thông tin thời gian
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
              startTime = fullHabit.frequency.startTime;
            } else if (fullHabit.type === "weekly") {
              const todayFreq = fullHabit.frequency.find((freq) => {
                const habitDay = freq.weekday === 7 ? 0 : freq.weekday;
                return habitDay === dayOfWeek;
              });
              startTime = todayFreq ? todayFreq.startTime : null;
            } else if (fullHabit.type === "monthly") {
              const todayFreq = fullHabit.frequency.find(
                (freq) => freq.day === dayOfMonth
              );
              startTime = todayFreq ? todayFreq.startTime : null;
            }
          }

          return {
            ...habit,
            startTime,
            endTime: fullHabit?.frequency?.endTime || null,
            priority: fullHabit?.priority || "medium",
            type: fullHabit?.type,
            isInGoals: fullHabit?.isInGoals ?? false, 
            habitName: fullHabit?.habitName || habit.habitName, 
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
      // Nếu lỗi thì set state mặc định (không có habits)
      setDayData({ habits: [], completionRate: 0 });
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  // Hàm toggle trạng thái hoàn thành của một habit
  const handleToggleComplete = async (habitId, completed) => {
    if (updatingHabits.has(habitId)) return; // Nếu habit này đang được update thì bỏ qua

    try {
      // Thêm habitId vào Set updatingHabits để disable nút khi đang update
      setUpdatingHabits((prev) => new Set([...prev, habitId]));

      // Gọi API update trạng thái habit
      await checkInHabit(habitId, selectedDate, completed, "");

      // Cập nhật state dayData ngay trên UI
      setDayData((prev) => {
        if (!prev) return prev;

        // Map lại habits → cập nhật habit vừa toggle
        const updatedHabits = prev.habits.map((habit) =>
          habit.habitId.toString() === habitId.toString()
            ? { ...habit, completed }
            : habit
        );

        // Tính số habits đã hoàn thành
        const completedCount = updatedHabits.filter((h) => h.completed).length;

        // Tính % hoàn thành
        const completionRate =
          updatedHabits.length > 0
            ? Math.round((completedCount / updatedHabits.length) * 100)
            : 0;

        // Trả về object mới để cập nhật state
        return {
          ...prev,
          habits: updatedHabits,
          completionRate,
          completedHabits: completedCount,
        };
      });

      // Nếu component cha truyền callback, gọi để báo có thay đổi
      if (onStatusChange) {
        onStatusChange(selectedDate);
      }
    } catch (error) {
      console.error("Failed to update habit status:", error);
    } finally {
      // Xóa habitId khỏi set updatingHabits sau khi xong
      setUpdatingHabits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  // Hàm format ngày sang định dạng mm/dd/yyyy
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Hàm format thời gian
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

  // JSX để render UI
  return (
    <Card className="shadow-sm border-0">
      {" "}
      {/* Thẻ Card từ bootstrap */}
      <Card.Body className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold">
            Habits for {formatDate(selectedDate)} {/* Hiển thị ngày */}
          </h5>
          <Badge
            // Badge màu theo % hoàn thành
            bg={
              dayData?.completionRate === 0
                ? "danger"
                : dayData?.completionRate === 100
                ? "success"
                : "warning"
            }
            className="rounded-pill px-3"
          >
            {dayData?.completionRate || 0}% Complete {/* Hiển thị % */}
          </Badge>
        </div>

        <p className="text-muted small mb-4">
          Habits are sorted by scheduled time (earliest first)
        </p>

        {/* Danh sách habits */}
        <div className="habits-list">
          {dayData?.habits && dayData.habits.length > 0 ? (
            // Nếu có habits → map ra danh sách
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

                {/* Thông tin Habit */}
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

                {/* Nút mark complete */}
                <Button
                  variant={habit.completed ? "success" : "outline-secondary"} // Màu theo trạng thái
                  size="sm"
                  onClick={() =>
                    handleToggleComplete(habit.habitId, !habit.completed)
                  } // Toggle complete
                  disabled={updatingHabits.has(habit.habitId)} // Disable khi đang update
                  className="rounded-pill px-3"
                >
                  {updatingHabits.has(habit.habitId) ? (
                    // Nếu đang update → hiển thị spinner
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
                    "✓ Completed" // Nếu completed
                  ) : (
                    "Mark Complete" // Nếu chưa completed
                  )}
                </Button>
              </div>
            ))
          ) : (
            // Nếu không có habits → hiển thị thông báo rỗng
            <div className="text-center py-5">
              <h6 className="text-muted">No habits found</h6>
              <p className="text-muted small mb-0">
                Create some habits to start tracking your progress!
              </p>
            </div>
          )}
        </div>
      </Card.Body>
      {/* CSS inline cho component */}
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

// Export component ra ngoài
export default HabitsForDate;
