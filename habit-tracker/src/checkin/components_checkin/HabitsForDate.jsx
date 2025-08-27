import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { TrendingUp } from 'lucide-react';
import { getCheckInsForDate, checkInHabit } from '../../services/checkInService';
import { useAuth } from '../../context/AuthContext';

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
        if (selectedDate && user) { // Nếu có ngày được chọn và user đã login
            loadDayData(selectedDate); // Gọi API load data cho ngày đó
        }
    }, [selectedDate, user, refreshTrigger]);

    // Hàm gọi API để lấy dữ liệu habits của một ngày
    const loadDayData = async (date) => {
        try {
            setLoading(true); // Bật trạng thái loading
            const data = await getCheckInsForDate(date); // Gọi API lấy data
            setDayData(data); // Cập nhật state với dữ liệu nhận được
        } catch (error) {
            console.error('Failed to load day data:', error);
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
            setUpdatingHabits(prev => new Set([...prev, habitId]));

            // Gọi API update trạng thái habit
            await checkInHabit(habitId, selectedDate, completed, '');

            // Cập nhật state dayData ngay trên UI
            setDayData(prev => {
                if (!prev) return prev;

                // Map lại habits → cập nhật habit vừa toggle
                const updatedHabits = prev.habits.map(habit =>
                    habit.habitId.toString() === habitId.toString()
                        ? { ...habit, completed }
                        : habit
                );

                // Tính số habits đã hoàn thành
                const completedCount = updatedHabits.filter(h => h.completed).length;

                // Tính % hoàn thành
                const completionRate = updatedHabits.length > 0
                    ? Math.round((completedCount / updatedHabits.length) * 100)
                    : 0;

                // Trả về object mới để cập nhật state
                return {
                    ...prev,
                    habits: updatedHabits,
                    completionRate,
                    completedHabits: completedCount
                };
            });

            // Nếu component cha truyền callback, gọi để báo có thay đổi
            if (onStatusChange) {
                onStatusChange(selectedDate);
            }
        } catch (error) {
            console.error('Failed to update habit status:', error);
        } finally {
            // Xóa habitId khỏi set updatingHabits sau khi xong
            setUpdatingHabits(prev => {
                const newSet = new Set(prev);
                newSet.delete(habitId);
                return newSet;
            });
        }
    };

    // Hàm format ngày sang định dạng mm/dd/yyyy
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Style inline cho icon habit (hình tròn có màu nền)
    const getHabitIconStyle = (color) => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%', // Làm tròn thành hình tròn
        backgroundColor: color || '#6c757d', // Nếu không có màu thì mặc định xám
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        marginRight: '16px'
    });

    // JSX để render UI
    return (
        <Card className="shadow-sm border-0"> {/* Thẻ Card từ bootstrap */}
            <Card.Body className="p-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0 fw-semibold">
                        Habits for {formatDate(selectedDate)} {/* Hiển thị ngày */}
                    </h5>
                    <Badge
                        // Badge màu theo % hoàn thành
                        bg={dayData?.completionRate === 0 ? 'danger' : dayData?.completionRate === 100 ? 'success' : 'warning'}
                        className="rounded-pill px-3"
                    >
                        {dayData?.completionRate || 0}% Complete {/* Hiển thị % */}
                    </Badge>
                </div>

                <p className="text-muted small mb-4">View or update past check-ins</p>

                {/* Danh sách habits */}
                <div className="habits-list">
                    {dayData?.habits && dayData.habits.length > 0 ? (
                        // Nếu có habits → map ra danh sách
                        dayData.habits.map((habit) => (
                            <div
                                key={habit.habitId}
                                className="habit-item d-flex align-items-center py-3"
                                style={{ borderBottom: '1px solid #f1f3f4' }}
                            >
                                {/* Icon Habit */}
                                <div style={getHabitIconStyle(habit.habitColor)}>
                                    {habit.habitIcon || ''}
                                </div>

                                {/* Thông tin Habit */}
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 fw-medium" style={{ fontSize: '16px' }}>
                                        {habit.habitName}
                                    </h6>
                                    {/* Hiển thị streak nếu > 0 */}
                                    {habit.streak > 0 && (
                                        <div className="d-flex align-items-center">
                                            <TrendingUp size={14} className="me-1" style={{ color: '#6c757d' }} />
                                            <span className="small text-muted">
                                                {habit.streak} day streak
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Nút mark complete */}
                                <Button
                                    variant={habit.completed ? "success" : "outline-secondary"} // Màu theo trạng thái
                                    size="sm"
                                    onClick={() => handleToggleComplete(habit.habitId, !habit.completed)} // Toggle complete
                                    disabled={updatingHabits.has(habit.habitId)} // Disable khi đang update
                                    className="rounded-pill px-3"
                                >
                                    {updatingHabits.has(habit.habitId) ? (
                                        // Nếu đang update → hiển thị spinner
                                        <>
                                            <div className="spinner-border spinner-border-sm me-1" role="status">
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

                .btn {
                    transition: all 0.2s ease;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }
            `}</style>
        </Card>
    );
};

// Export component ra ngoài
export default HabitsForDate;
