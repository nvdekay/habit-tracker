import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { getCheckInsForDate } from '../../services/checkInService';
import { useAuth } from '../../context/AuthContext';

const DailySummary = ({ selectedDate, refreshTrigger }) => {
    const [summaryData, setSummaryData] = useState({
        completed: 0,
        remaining: 0,
        completionRate: 0,
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (selectedDate && user) {
            loadSummaryData(selectedDate);
        }
    }, [selectedDate, user, refreshTrigger]);

    const loadSummaryData = async (date) => {
        try {
            setLoading(true);
            const data = await getCheckInsForDate(date);
            
            const completed = data.completedHabits || 0;
            const total = data.totalHabits || 0;
            const remaining = total - completed;
            const completionRate = data.completionRate || 0;

            setSummaryData({
                completed,
                remaining,
                completionRate,
                total
            });
        } catch (error) {
            console.error('Failed to load summary data:', error);
            setSummaryData({
                completed: 0,
                remaining: 0,
                completionRate: 0,
                total: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const StatCard = ({ value, label, color }) => (
        <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="py-4">
                <div 
                    className="display-6 fw-bold mb-2"
                    style={{ color: color, fontSize: '2.5rem' }}
                >
                    {loading ? (
                        <div className="spinner-border" role="status" style={{ width: '2rem', height: '2rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        value
                    )}
                </div>
                <div className="text-muted fw-medium" style={{ fontSize: '14px' }}>
                    {label}
                </div>
            </Card.Body>
        </Card>
    );

    return (
        <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
                {/* Header */}
                <div className="mb-4">
                    <h5 className="mb-1 fw-semibold">Daily Summary</h5>
                    <p className="text-muted small mb-0">
                        Your progress for {formatDate(selectedDate)}
                    </p>
                </div>

                {/* Stats Grid */}
                <Row className="g-3">
                    <Col xs={12} md={4}>
                        <StatCard 
                            value={summaryData.completed}
                            label="Completed"
                            color="#28a745"
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <StatCard 
                            value={summaryData.remaining}
                            label="Remaining"
                            color="#343a40"
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <StatCard 
                            value={`${summaryData.completionRate}%`}
                            label="Completion Rate"
                            color="#007bff"
                        />
                    </Col>
                </Row>
            </Card.Body>

            <style jsx>{`
                .card {
                    transition: all 0.2s ease;
                }

                .card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                }

                @media (max-width: 768px) {
                    .display-6 {
                        font-size: 2rem !important;
                    }
                }
            `}</style>
        </Card>
    );
};

export default DailySummary;