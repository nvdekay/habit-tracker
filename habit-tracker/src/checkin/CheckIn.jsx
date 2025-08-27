import React, { useState, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import CalendarView from './components_checkin/CalendarView';
import DailySummary from './components_checkin/DailySummary';
import HabitsForDate from './components_checkin/HabitsForDate';
import { useAuth } from '../context/AuthContext';

export default function CheckIn() {
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [calendarData, setCalendarData] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { user } = useAuth();

    // Xử lý khi user chọn ngày mới trên calendar
    const handleDateSelect = useCallback((date) => {
        setSelectedDate(date);
    }, []);

    // Cập nhật dữ liệu completion rate từ CalendarView
    const handleCalendarDataUpdate = useCallback((data) => {
        setCalendarData(data);
    }, []);

    // Xử lý khi status của habit thay đổi
    const handleStatusChange = useCallback((date) => {
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
        
        // Reset data cho ngày đó để load lại
        setCalendarData(prev => ({
            ...prev,
            [date]: undefined
        }));
    }, []);

    if (!user) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="text-center">
                    <h3 className="mb-3">Please log in to access Daily Check-in</h3>
                </div>
            </div>
        );
    }

    return (
            <Container className="py-4">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="fw-bold mb-1" style={{ fontSize: '32px', color: '#1a1a1a' }}>
                        Daily Check-in
                    </h1>
                    <p className="text-muted mb-0" style={{ fontSize: '16px' }}>
                        Mark your habits as complete and track your progress
                    </p>
                </div>

                {/* Main Layout */}
                <Row className="g-4">
                    {/* Left Column - Calendar */}
                    <Col lg={5} xl={4}>
                        <CalendarView
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            calendarData={calendarData}
                            onCalendarDataUpdate={handleCalendarDataUpdate}
                        />
                    </Col>

                    {/* Right Column - Habits and Summary */}
                    <Col lg={7} xl={8}>
                        <Row className="g-4">
                            {/* Habits for Selected Date */}
                            <Col xs={12}>
                                <HabitsForDate
                                    selectedDate={selectedDate}
                                    onStatusChange={handleStatusChange}
                                    refreshTrigger={refreshTrigger}
                                />
                            </Col>

                            {/* Daily Summary */}
                            <Col xs={12}>
                                <DailySummary
                                    selectedDate={selectedDate}
                                    refreshTrigger={refreshTrigger}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
    );
}