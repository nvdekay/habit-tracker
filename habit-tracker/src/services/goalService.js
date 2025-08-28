import axios from "axios";

const BASE_URL = "http://localhost:8080/goals";

export const getGoalsByUserID = async (userID) => {
  const res = await fetch(`${BASE_URL}?userId=${userID}`);
  if (!res.ok) throw new Error("Failed to fetch goals");
  return res.json();
};
export const getHabits = async (userID) => {
  const res = await fetch("http://localhost:8080/habits?userId=" + userID);
  if (!res.ok) throw new Error("Failed to fetch goals");
  return res.json();
};

export async function updateGoal(goal) {
  try {
    const res = await axios.put(`${BASE_URL}/${goal.id}`, goal, {
      headers: { "Content-Type": "application/json" },
    });
    return res;
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error; // quăng lỗi ra ngoài cho component xử lý
  }
}

export async function deleteGoal(goalID) {
  try {
    const res = await axios.delete(`${BASE_URL}/${goalID}`);
    return res;
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
}

export async function createGoal(newGoal) {
  try {
    const res = await axios.post(BASE_URL, newGoal, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
}

export function calculateHabitTarget(habit, goalStartDate, goalEndDate) {
  const start = new Date(goalStartDate);
  const end = new Date(goalEndDate);

  if (habit.type === "daily") {
    const habitStart = new Date(habit.startDate);
    const habitEnd = new Date(habit.endDate);
    const s = start > habitStart ? start : habitStart;
    const e = end < habitEnd ? end : habitEnd;
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  }

  if (habit.type === "weekly") {
    const habitStart = new Date(habit.startDate);
    const habitEnd = new Date(habit.endDate);
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
    const habitStart = new Date(habit.startDate);
    const habitEnd = new Date(habit.endDate);
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

export const getGoalsForDate = async (userId, date) => {
  try {
    const response = await fetch(
      `http://localhost:8080/goals?userId=${userId}&date=${date}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const goals = await response.json();

    // Bạn có thể thêm logic lọc bổ sung nếu cần, ví dụ:
    // Lọc những goals có type là "auto" và status không phải là "completed"
    const filteredGoals = goals.filter(
      (goal) => goal.type === "auto" && goal.status !== "completed"
    );

    return filteredGoals;
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    // Trả về mảng rỗng nếu có lỗi
    return [];
  }
};

export const updateGoalStatus = async (goalId, newStatus) => {
  try {
    const response = await fetch(`http://localhost:8080/goals/${goalId}`, {
      method: "PATCH", // Sử dụng PATCH để cập nhật một phần dữ liệu
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
        // Có thể thêm các trường khác cần cập nhật nếu có
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const updatedGoal = await response.json();
    return updatedGoal;
  } catch (error) {
    console.error("Failed to update goal status:", error);
    throw error; // Ném lỗi để component gọi có thể xử lý
  }
};
