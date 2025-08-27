import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { updateHabit } from '../../services/habitService';
import { Pencil } from 'lucide-react';

export default function Edit({ habit, setHabits, setFilteredHabits, setSuccess, setError, loading, setLoading }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentHabit, setCurrentHabit] = useState({
        ...habit,
        frequency: habit.type === 'daily' ? habit.frequency : habit.frequency || []
    });
    const [weeklyDays, setWeeklyDays] = useState(
        habit.type === 'weekly' ? habit.frequency.map(f => f.weekday) : []
    );
    const [monthlyDays, setMonthlyDays] = useState(
        habit.type === 'monthly' ? habit.frequency.map(f => f.day) : []
    );
    const [timeFrame, setTimeFrame] = useState(
        habit.type === 'daily'
            ? habit.frequency
            : habit.frequency && habit.frequency.length > 0
                ? { startTime: habit.frequency[0].startTime, endTime: habit.frequency[0].endTime }
                : { startTime: '00:00:00', endTime: '00:30:00' }
    );

    useEffect(() => {
        // Đồng bộ currentHabit khi habit prop thay đổi
        setCurrentHabit({
            ...habit,
            frequency: habit.type === 'daily' ? habit.frequency : habit.frequency || []
        });
        setWeeklyDays(habit.type === 'weekly' ? habit.frequency.map(f => f.weekday) : []);
        setMonthlyDays(habit.type === 'monthly' ? habit.frequency.map(f => f.day) : []);
        setTimeFrame(
            habit.type === 'daily'
                ? habit.frequency
                : habit.frequency && habit.frequency.length > 0
                    ? { startTime: habit.frequency[0].startTime, endTime: habit.frequency[0].endTime }
                    : { startTime: '00:00:00', endTime: '00:30:00' }
        );
    }, [habit]);

    const handleEditHabit = async (e) => {
        e.preventDefault();
        if (!habit.userId) {
            setError('Please log in to edit a habit');
            return;
        }
        setLoading(true);
        try {
            let formattedHabit = { ...currentHabit };
            if (currentHabit.type === 'weekly') {
                formattedHabit.frequency = weeklyDays.map(day => ({
                    weekday: day,
                    startTime: timeFrame.startTime,
                    endTime: timeFrame.endTime
                }));
            } else if (currentHabit.type === 'monthly') {
                formattedHabit.frequency = monthlyDays.map(day => ({
                    day: parseInt(day),
                    startTime: timeFrame.startTime,
                    endTime: timeFrame.endTime
                }));
            }
            const updatedHabit = await updateHabit(currentHabit.id, formattedHabit);
            setHabits(prev => prev.map(h => (h.id === currentHabit.id ? updatedHabit : h)));
            setFilteredHabits(prev => prev.map(h => (h.id === currentHabit.id ? updatedHabit : h)));
            setShowEditModal(false);
            setSuccess('Habit updated successfully');
            setTimeout(() => setSuccess(null), 3000);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (type) => {
        setCurrentHabit({
            ...currentHabit,
            type,
            frequency: type === 'daily' ? { startTime: '00:00:00', endTime: '00:30:00' } : []
        });
        setWeeklyDays([]);
        setMonthlyDays([]);
        setTimeFrame({ startTime: '00:00:00', endTime: '00:30:00' });
    };

    const toggleWeeklyDay = (day) => {
        setWeeklyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleMonthlyDayChange = (e) => {
        const day = e.target.value;
        if (day >= 1 && day <= 31) {
            setMonthlyDays(prev =>
                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            );
        }
    };

    return (
        <>
            <Button
                variant="warning"
                onClick={() => setShowEditModal(true)}
                disabled={loading}
                className="p-1 me-2"
            >
                <Pencil size={20} />
            </Button>
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Habit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentHabit && (
                        <Form onSubmit={handleEditHabit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Habit Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={currentHabit.name}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, name: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={currentHabit.description}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, description: e.target.value })}
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                    value={currentHabit.type}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Form.Select>
                            </Form.Group>
                            {currentHabit.type === 'daily' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={currentHabit.frequency.startTime?.slice(0, 5) || '00:00'}
                                            onChange={(e) =>
                                                setCurrentHabit({
                                                    ...currentHabit,
                                                    frequency: { ...currentHabit.frequency, startTime: `${e.target.value}:00` }
                                                })
                                            }
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={currentHabit.frequency.endTime?.slice(0, 5) || '00:30'}
                                            onChange={(e) =>
                                                setCurrentHabit({
                                                    ...currentHabit,
                                                    frequency: { ...currentHabit.frequency, endTime: `${e.target.value}:00` }
                                                })
                                            }
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </>
                            )}
                            {currentHabit.type === 'weekly' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Days of Week</Form.Label>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                                            <Form.Check
                                                key={index + 1}
                                                type="checkbox"
                                                label={day}
                                                checked={weeklyDays.includes(index + 1)}
                                                onChange={() => toggleWeeklyDay(index + 1)}
                                                disabled={loading}
                                            />
                                        ))}
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={timeFrame.startTime.slice(0, 5)}
                                            onChange={(e) => setTimeFrame({ ...timeFrame, startTime: `${e.target.value}:00` })}
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={timeFrame.endTime.slice(0, 5)}
                                            onChange={(e) => setTimeFrame({ ...timeFrame, endTime: `${e.target.value}:00` })}
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </>
                            )}
                            {currentHabit.type === 'monthly' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Days of Month (1-31)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max="31"
                                            onChange={handleMonthlyDayChange}
                                            disabled={loading}
                                            placeholder="Enter day (1-31)"
                                        />
                                        <div className="mt-2">
                                            Selected days: {monthlyDays.join(', ') || 'None'}
                                        </div>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={timeFrame.startTime.slice(0, 5)}
                                            onChange={(e) => setTimeFrame({ ...timeFrame, startTime: `${e.target.value}:00` })}
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={timeFrame.endTime.slice(0, 5)}
                                            onChange={(e) => setTimeFrame({ ...timeFrame, endTime: `${e.target.value}:00` })}
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </>
                            )}
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={currentHabit.startDate}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, startDate: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={currentHabit.endDate}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, endDate: e.target.value })}
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Priority</Form.Label>
                                <Form.Select
                                    value={currentHabit.priority}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, priority: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </Form.Select>
                            </Form.Group>
                            <Button type="submit" variant="warning" disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}