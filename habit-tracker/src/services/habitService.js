import axios from 'axios';

const API_URL = "http://localhost:8080";

export async function getHabits() {
    try {
        const res = await axios.get(`${API_URL}/habits`);
        return res.data;
    } catch (error) {
        console.log("Failed to fetch habits" + error);
    }
}

export async function createHabit(habit) {
    try {
        const res = await axios.post(`${API_URL}/habits`, habit);
        return res.data;
    } catch (error) {
        console.log("Failed to create habits" + error);
    }
}

export async function updateHabit(id, habit) {
    try {
        const res = await axios.put(`${API_URL}/habits/${id}`, habit);
        return res.data;
    } catch (error) {
        console.log("Failed to update habits" + error);
    }
}

export async function deleteHabit(id) {
    try {
        await axios.delete(`${API_URL}/habits/${id}`);
        return true;
    } catch (error) {
        console.log("Failed to delete habits" + error);
    }
}