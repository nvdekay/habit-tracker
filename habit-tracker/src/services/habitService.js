// habitService.js
const API_URL = "http://localhost:8080/api/habits";

// Lấy danh sách thói quen
export async function getHabits() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch habits");
    return res.json();
}

// Tạo mới thói quen
export async function createHabit(habit) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(habit),
    });
    if (!res.ok) throw new Error("Failed to create habit");
    return res.json();
}

// Cập nhật thói quen
export async function updateHabit(id, habit) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(habit),
    });
    if (!res.ok) throw new Error("Failed to update habit");
    return res.json();
}

// Xóa thói quen
export async function deleteHabit(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete habit");
    return true;
}
