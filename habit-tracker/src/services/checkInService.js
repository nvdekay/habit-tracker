// checkInService.js
import { getHabits } from "./habitService"

const BASE_URL = "http://localhost:8080/checkins"

// Tạo check-in mới
export async function checkInHabit(habitId, date, completed, notes) {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            habitId,
            date,
            completed,
            notes,
            completedAt: new Date().toISOString(),
        }),
    })

    if (!response.ok) {
        throw new Error("Failed to save check-in")
    }

    return response.json()
}

// Lấy check-in theo ngày
export async function getCheckInsForDate(date) {
    const habitsResult = await getHabits({}, 1, 100)
    const habits = habitsResult.habits || habitsResult // tùy API trả về

    const response = await fetch(`${BASE_URL}?date=${date}`)
    if (!response.ok) {
        throw new Error("Failed to fetch check-ins for date")
    }
    const dayCheckIns = await response.json()

    const habitCheckIns = habits.map((habit) => {
        const checkIn = dayCheckIns.find((c) => c.habitId === habit.id)
        return {
            habitId: habit.id,
            habitName: habit.name,
            habitIcon: habit.icon,
            habitColor: habit.color,
            completed: checkIn?.completed || false,
            streak: habit.streak || 0,
        }
    })

    const completedCount = habitCheckIns.filter((h) => h.completed).length
    const completionRate =
        habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0

    return {
        date,
        habits: habitCheckIns,
        completionRate,
    }
}

// Lịch sử check-in trong khoảng ngày
export async function getCheckInHistory(startDate, endDate) {
    const response = await fetch(
        `${BASE_URL}?startDate=${startDate}&endDate=${endDate}`
    )
    if (!response.ok) {
        throw new Error("Failed to fetch check-in history")
    }
    return response.json()
}

// Tính streak của habit
export async function getStreakData(habitId) {
    const response = await fetch(`${BASE_URL}?habitId=${habitId}&completed=true`)
    if (!response.ok) {
        throw new Error("Failed to fetch streak data")
    }
    const habitCheckIns = await response.json()

    // Sort desc theo ngày
    habitCheckIns.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Current streak
    let currentStreak = 0
    const today = new Date()
    const checkDate = new Date(today)

    for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split("T")[0]
        const hasCheckIn = habitCheckIns.some((c) => c.date === dateStr)

        if (hasCheckIn) {
            currentStreak++
        } else {
            break
        }

        checkDate.setDate(checkDate.getDate() - 1)
    }

    // Longest streak
    let longestStreak = 0
    let tempStreak = 0
    let prevDate = null

    for (const checkIn of habitCheckIns) {
        const d = new Date(checkIn.date)
        if (
            prevDate &&
            (prevDate.getTime() - d.getTime()) / (1000 * 3600 * 24) === 1
        ) {
            tempStreak++
        } else {
            tempStreak = 1
        }
        longestStreak = Math.max(longestStreak, tempStreak)
        prevDate = d
    }

    return { currentStreak, longestStreak }
}

// Lấy dữ liệu calendar
export async function getCalendarData(year, month) {
    const startDate = new Date(year, month, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

    const response = await fetch(
        `${BASE_URL}?startDate=${startDate}&endDate=${endDate}`
    )
    if (!response.ok) {
        throw new Error("Failed to fetch calendar data")
    }
    const checkIns = await response.json()

    const calendarData = {}

    for (
        let date = new Date(startDate);
        date <= new Date(endDate);
        date.setDate(date.getDate() + 1)
    ) {
        const dateStr = date.toISOString().split("T")[0]
        const dayCheckIns = checkIns.filter((c) => c.date === dateStr)
        const completedCount = dayCheckIns.filter((c) => c.completed).length
        const totalHabits = 4 // TODO: thay bằng habits.length nếu muốn real-time
        calendarData[dateStr] =
            totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0
    }

    return calendarData
}
