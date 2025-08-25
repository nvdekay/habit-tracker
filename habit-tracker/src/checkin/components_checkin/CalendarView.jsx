import { useState, useEffect } from "react"
import { Button, Container, Row, Col } from "react-bootstrap"
import { getCalendarData } from "../../services/checkInService"
import { ChevronLeft, ChevronRight } from "lucide-react"

function CalendarView({ selectedDate, onDateSelect }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [calendarData, setCalendarData] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadCalendarData = async () => {
            try {
                setLoading(true)
                const year = currentMonth.getFullYear()
                const month = currentMonth.getMonth()
                const data = await getCalendarData(year, month)
                setCalendarData(data)
            } catch (error) {
                console.error("Failed to load calendar data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadCalendarData()
    }, [currentMonth])

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

    const getCompletionColor = (rate) => {
        if (!rate) return "bg-secondary"
        if (rate >= 80) return "bg-success"
        if (rate >= 60) return "bg-warning"
        if (rate >= 40) return "bg-orange"
        return "bg-danger"
    }

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay()
    }

    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            )
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateStr = date.toISOString().split('T')[0]
            const isSelected = selectedDate === dateStr
            const completionRate = calendarData[dateStr] || 0

            days.push(
                <div
                    key={dateStr}
                    className={`calendar-day ${isSelected ? 'selected' : ''}`}
                    onClick={() => onDateSelect(dateStr)}
                >
                    <div className="day-number">{day}</div>
                    <div 
                        className={`completion-indicator ${getCompletionColor(completionRate)}`}
                        title={`${completionRate}% completed`}
                    ></div>
                </div>
            )
        }

        return days
    }

    return (
        <Container className="my-3">
            <Row className="align-items-center mb-3">
                <Col xs="auto">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                        disabled={loading}
                    >
                        <ChevronLeft size={16} />
                    </Button>
                </Col>
                <Col className="text-center">
                    <h5 className="fw-semibold mb-0">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h5>
                </Col>
                <Col xs="auto">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigateMonth("next")}
                        disabled={loading}
                    >
                        <ChevronRight size={16} />
                    </Button>
                </Col>
            </Row>

            <div className={`calendar-grid ${loading ? "opacity-50" : ""}`}>
                <div className="weekday">Sun</div>
                <div className="weekday">Mon</div>
                <div className="weekday">Tue</div>
                <div className="weekday">Wed</div>
                <div className="weekday">Thu</div>
                <div className="weekday">Fri</div>
                <div className="weekday">Sat</div>
                {renderCalendarDays()}
            </div>

            <div className="mt-3 small text-muted">
                <div className="fw-semibold">Completion Rate:</div>
                <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                    <span className="d-flex align-items-center">
                        <span className="d-inline-block rounded-circle bg-secondary me-1" style={{ width: 12, height: 12 }}></span>
                        No data/0%
                    </span>
                    <span className="d-flex align-items-center">
                        <span className="d-inline-block rounded-circle bg-danger me-1" style={{ width: 12, height: 12 }}></span>
                        1-39%
                    </span>
                    <span className="d-flex align-items-center">
                        <span className="d-inline-block rounded-circle bg-orange me-1" style={{ width: 12, height: 12 }}></span>
                        40-59%
                    </span>
                    <span className="d-flex align-items-center">
                        <span className="d-inline-block rounded-circle bg-warning me-1" style={{ width: 12, height: 12 }}></span>
                        60-79%
                    </span>
                    <span className="d-flex align-items-center">
                        <span className="d-inline-block rounded-circle bg-success me-1" style={{ width: 12, height: 12 }}></span>
                        80-100%
                    </span>
                </div>
            </div>

            <style jsx>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    background-color: #f8f9fa;
                    padding: 2px;
                    border-radius: 8px;
                }

                .weekday {
                    text-align: center;
                    padding: 8px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #6c757d;
                }

                .calendar-day {
                    aspect-ratio: 1;
                    background-color: white;
                    padding: 4px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .calendar-day:hover {
                    background-color: #f8f9fa;
                }

                .calendar-day.selected {
                    background-color: #e9ecef;
                }

                .calendar-day.empty {
                    background-color: transparent;
                    cursor: default;
                }

                .day-number {
                    font-size: 0.875rem;
                    margin-bottom: 4px;
                }

                .completion-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
            `}</style>
        </Container>
    )
}

export default CalendarView