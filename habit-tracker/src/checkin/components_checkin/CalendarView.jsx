import { useState, useEffect } from "react"
import { Button, Card } from "react-bootstrap"
import { getCalendarData } from "../../services/checkInService"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

function CalendarView({ selectedDate, onDateSelect, calendarData, onCalendarDataUpdate }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [internalCalendarData, setInternalCalendarData] = useState({})
    const [loading, setLoading] = useState(false)
    const { user, isAuthenticated } = useAuth()

    useEffect(() => {
        if (isAuthenticated && user) {
            loadCalendarData()
        }
    }, [currentMonth, user, isAuthenticated])

    const loadCalendarData = async () => {
        try {
            setLoading(true)
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            // Call API to get completion rate for all days in the month
            const data = await getCalendarData(year, month)
            setInternalCalendarData(data)
            // Pass data to parent component
            if (onCalendarDataUpdate) {
                onCalendarDataUpdate(data)
            }
        } catch (error) {
            console.error("Failed to load calendar data:", error)
            setInternalCalendarData({})
        } finally {
            setLoading(false)
        }
    }

    const finalCalendarData = { ...internalCalendarData, ...calendarData }

    const navigateMonth = (direction) => {
        setCurrentMonth(prevMonth => {
            const newMonth = new Date(prevMonth)
            if (direction === "prev") {
                newMonth.setMonth(prevMonth.getMonth() - 1)
            } else {
                newMonth.setMonth(prevMonth.getMonth() + 1)
            }
            return newMonth
        })
    }

    // Get number of days in a specific month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // Get the day of week for first day of month
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay()
    }

    // Check if a date is today
    const isToday = (date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    // Check if current date is selected
    const isSelected = (dateStr) => {
        return selectedDate === dateStr
    }

    // Determine dot color based on completion rate
    const getCompletionDotColor = (rate) => {
        if (!rate || rate === 0) return "#e9ecef"  // No data → gray
        if (rate >= 80) return "#28a745"           // >=80% → green
        if (rate >= 60) return "#ffc107"           // >=60% → yellow
        if (rate >= 40) return "#fd7e14"           // >=40% → orange
        return "#dc3545"                           // <40% → red
    }

    // Render all days in the calendar month
    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const days = []

        // Add empty cells before first day of month (for proper week alignment)
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            )
        }

        // Add each day in the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateStr = date.toISOString().split('T')[0]
            const completionRate = finalCalendarData[dateStr] || 0
            const isCurrentSelected = isSelected(dateStr)
            const isTodayDate = isToday(date)

            days.push(
                <div
                    key={dateStr}
                    className={`calendar-day ${isCurrentSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                    onClick={() => onDateSelect && onDateSelect(dateStr)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="day-number">{day}</div>
                    <div
                        className="completion-dot"
                        style={{ backgroundColor: getCompletionDotColor(completionRate) }}
                    ></div>
                </div>
            )
        }

        return days
    }

    return (
        <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
                {/* Header */}
                <div className="d-flex align-items-center mb-3">
                    <Calendar size={20} className="me-2 text-muted" />
                    <h5 className="mb-0 fw-semibold">Calendar View</h5>
                </div>
                <p className="text-muted small mb-4">Select a date to view or update check-ins</p>

                {/* Month Navigation */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <Button
                        variant="link"
                        className="p-0 text-decoration-none text-muted"
                        onClick={() => navigateMonth("prev")}
                        disabled={loading}
                    >
                        <ChevronLeft size={20} />
                    </Button>

                    <h5 className="mb-0 fw-semibold">
                        {currentMonth.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric"
                        })}
                    </h5>

                    <Button
                        variant="link"
                        className="p-0 text-decoration-none text-muted"
                        onClick={() => navigateMonth("next")}
                        disabled={loading}
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                    <div className="weekday">Sun</div>
                    <div className="weekday">Mon</div>
                    <div className="weekday">Tue</div>
                    <div className="weekday">Wed</div>
                    <div className="weekday">Thu</div>
                    <div className="weekday">Fri</div>
                    <div className="weekday">Sat</div>
                    {renderCalendarDays()}
                </div>
            </Card.Body>

            <style jsx>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                }

                .weekday {
                    text-align: center;
                    padding: 8px 4px;
                    font-weight: 500;
                    font-size: 14px;
                    color: #6c757d;
                }

                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    position: relative;
                    padding: 8px 4px;
                }

                .calendar-day:hover {
                    background-color: #f8f9fa;
                }

                .calendar-day.selected {
                    background-color: #007bff;
                    color: white;
                }

                .calendar-day.today {
                    background-color: #6f42c1;
                    color: white;
                }

                .calendar-day.today.selected {
                    background-color: #007bff;
                }

                .calendar-day.empty {
                    cursor: default;
                }

                .calendar-day.empty:hover {
                    background-color: transparent;
                }

                .day-number {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .completion-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .legend-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                @media (max-width: 768px) {
                    .calendar-day {
                        padding: 4px;
                    }
                    
                    .day-number {
                        font-size: 12px;
                    }
                    
                    .completion-dot {
                        width: 4px;
                        height: 4px;
                    }
                }
            `}</style>
        </Card>
    )
}

export default CalendarView