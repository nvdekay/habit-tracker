import React, { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { Bell, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUpcomingHabits } from '../services/notificationService';
import { checkInHabit } from '../services/checkInService';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadNotifications();
            // Refresh notifications every 5 minutes
            const interval = setInterval(loadNotifications, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const upcomingHabits = await getUpcomingHabits();
            setNotifications(upcomingHabits);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickCheckIn = async (habitId, habitName) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await checkInHabit(habitId, today, true, 'Quick check-in from notification');
            
            // Remove notification after check-in
            setNotifications(prev => 
                prev.filter(n => n.habitId !== habitId)
            );
            
            // Show success feedback (optional)
            console.log(`Successfully checked in: ${habitName}`);
        } catch (error) {
            console.error('Failed to check in habit:', error);
        }
    };

    const formatTimeUntil = (timeString) => {
        const now = new Date();
        const habitTime = new Date();
        const [hours, minutes] = timeString.split(':');
        habitTime.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const diffMs = habitTime - now;
        if (diffMs <= 0) {
            return 'Now';
        }
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes % 60}m`;
        }
        return `${diffMinutes}m`;
    };

    const NotificationItem = ({ notification }) => (
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div className="d-flex align-items-center flex-grow-1 me-3">
                <div 
                    className="notification-indicator me-2"
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#007bff',
                        flexShrink: 0
                    }}
                />
                <div>
                    <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>
                        {notification.habitName}
                    </div>
                    <div className="d-flex align-items-center text-muted small">
                        <Clock size={12} className="me-1" />
                        Due in {formatTimeUntil(notification.startTime)}
                    </div>
                </div>
            </div>
            <button
                className="btn btn-sm btn-outline-success rounded-pill px-3"
                onClick={() => handleQuickCheckIn(notification.habitId, notification.habitName)}
                style={{ fontSize: '12px' }}
            >
                <CheckCircle size={14} className="me-1" />
                Done
            </button>
        </div>
    );

    return (
        <Dropdown align="end">
            <Dropdown.Toggle 
                variant="link" 
                className="position-relative p-2 text-decoration-none border-0 bg-transparent"
                style={{ color: '#6c757d' }}
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <Badge 
                        bg="danger" 
                        className="position-absolute translate-middle badge rounded-pill"
                        style={{ 
                            top: '6px', 
                            right: '6px', 
                            fontSize: '10px',
                            minWidth: '18px',
                            height: '18px'
                        }}
                    >
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu 
                className="shadow-lg border-0" 
                style={{ 
                    width: '350px', 
                    maxWidth: '90vw',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}
            >
                <div className="px-3 py-2 border-bottom bg-light">
                    <h6 className="mb-0 fw-semibold">Upcoming Habits</h6>
                    <small className="text-muted">Habits due in the next 2 hours</small>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-4">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        Loading...
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <NotificationItem 
                            key={`${notification.habitId}-${notification.date}`}
                            notification={notification} 
                        />
                    ))
                ) : (
                    <div className="text-center py-4">
                        <Bell size={32} className="text-muted mb-2" />
                        <div className="text-muted">No upcoming habits</div>
                        <small className="text-muted">Great job staying on track!</small>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="px-3 py-2 border-top bg-light">
                        <button 
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={loadNotifications}
                        >
                            Refresh notifications
                        </button>
                    </div>
                )}
            </Dropdown.Menu>

            <style jsx>{`
                .dropdown-toggle::after {
                    display: none;
                }
                
                .dropdown-item:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </Dropdown>
    );
};

export default NotificationBell;