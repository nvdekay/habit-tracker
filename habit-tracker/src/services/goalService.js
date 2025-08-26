const BASE_URL = "http://localhost:8080/goals";

export const getGoals = async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Failed to fetch goals");
    return res.json();
}

export const createGoal = async (goal) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error("Failed to create goal");
    return res.json();
}

export const getGoalById = async (goalId) => {
    const res = await fetch(`${BASE_URL}/${goalId}`);
    if (!res.ok) throw new Error("Failed to fetch goal");
    return res.json();
}

export const getGoalByUserId = async (userId) => {
    const res = await fetch(`${BASE_URL}?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch goals for user");
    return res.json();
}