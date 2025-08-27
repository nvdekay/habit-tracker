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
