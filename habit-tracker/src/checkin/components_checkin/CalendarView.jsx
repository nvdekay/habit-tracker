import { useState, useEffect } from "react"
import { Button, Card } from "react-bootstrap"
import { getCalendarData } from "../../services/checkInService"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

function CalendarView({ selectedDate, onDateSelect, calendarData, onCalendarDataUpdate }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [internalCalendarData, setInternalCalendarData] = useState({})
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            loadCalendarData()
        }
    }, [currentMonth, user])

    const loadCalendarData = async () => {
        try {
            setLoading(true)
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            // Gọi API lấy completion rate cho tất cả ngày trong tháng
            const data = await getCalendarData(year, month)
            setInternalCalendarData(data)
            // Truyền data lên parent component
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

    // Hàm lấy số ngày trong một tháng cụ thể
    const getDaysInMonth = (year, month) => {
        // new Date(year, month + 1, 0): tạo ra ngày cuối cùng của tháng (0 nghĩa là ngày trước ngày 1 của tháng tiếp theo)
        // getDate() sẽ trả về số ngày trong tháng đó
        return new Date(year, month + 1, 0).getDate()
    }

    // Hàm lấy ngày trong tuần của ngày đầu tiên trong tháng
    const getFirstDayOfMonth = (year, month) => {
        // new Date(year, month, 1): tạo ra ngày đầu tiên trong tháng
        // getDay() trả về số nguyên 0–6 (0 = Chủ Nhật, 1 = Thứ Hai, ...)
        return new Date(year, month, 1).getDay()
    }

    // Hàm kiểm tra xem một date có phải là hôm nay hay không
    const isToday = (date) => {
        const today = new Date() // Lấy ngày hiện tại
        // So sánh chuỗi ngày (yyyy-mm-dd) của date với today
        return date.toDateString() === today.toDateString()
    }

    // Hàm kiểm tra xem ngày hiện tại có phải là ngày được chọn không
    const isSelected = (dateStr) => {
        // so sánh string của ngày (ISO format: yyyy-mm-dd) với selectedDate trong state
        return selectedDate === dateStr
    }

    // Hàm xác định màu dot theo tỷ lệ hoàn thành
    const getCompletionDotColor = (rate) => {
        if (!rate || rate === 0) return "#e9ecef"  // Chưa có dữ liệu → màu xám
        if (rate >= 80) return "#28a745"           // >=80% → xanh lá
        if (rate >= 60) return "#ffc107"           // >=60% → vàng
        if (rate >= 40) return "#fd7e14"           // >=40% → cam
        return "#dc3545"                           // <40% → đỏ
    }

    // Hàm render tất cả các ngày trong tháng ra calendar
    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear() // Lấy năm hiện tại từ currentMonth
        const month = currentMonth.getMonth()   // Lấy tháng hiện tại (0-11)

        const daysInMonth = getDaysInMonth(year, month) // Số ngày trong tháng
        const firstDay = getFirstDayOfMonth(year, month) // Ngày bắt đầu của tháng (0–6)
        const days = [] // Mảng chứa các element ngày để render

        // Thêm các ô trống trước ngày đầu tiên trong tháng (để căn đúng thứ trong tuần)
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            )
        }

        // Thêm từng ngày trong tháng
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)              // Tạo object Date cho ngày hiện tại
            const dateStr = date.toISOString().split('T')[0]    // Lấy chuỗi yyyy-mm-dd
            const completionRate = finalCalendarData[dateStr] || 0 // Lấy tỷ lệ hoàn thành từ dữ liệu, mặc định = 0
            const isCurrentSelected = isSelected(dateStr)       // Kiểm tra có được chọn không
            const isTodayDate = isToday(date)                   // Kiểm tra có phải hôm nay không

            // Push một ô ngày vào mảng days
            days.push(
                <div
                    key={dateStr} // key duy nhất
                    className={`calendar-day ${isCurrentSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                    onClick={() => onDateSelect && onDateSelect(dateStr)} // Khi click gọi callback chọn ngày
                    role="button" // Để hỗ trợ accessibility (screen reader)
                    tabIndex={0}  // Để có thể focus bằng bàn phím
                >
                    <div className="day-number">{day}</div> {/* Hiển thị số ngày */}
                    <div
                        className="completion-dot"
                        style={{ backgroundColor: getCompletionDotColor(completionRate) }} // Màu dot theo tỷ lệ hoàn thành
                    ></div>
                </div>
            )
        }

        return days // Trả về mảng các element ngày để render
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