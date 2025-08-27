import React, { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { createHabit } from '../../services/habitService';

export default function Create({ user, setHabits, setFilteredHabits, setSuccess, setError, loading, setLoading, habits }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newHabit, setNewHabit] = useState({
        name: '',
        description: '',
        type: 'daily',
        frequency: { startTime: '00:00:00', endTime: '00:30:00' },
        startDate: '',
        endDate: '',
        priority: 'medium',
        isActive: true,
        userId: user ? user.id : ''
    });
    const [weeklyDays, setWeeklyDays] = useState([]);
    const [monthlyDays, setMonthlyDays] = useState([]);
    const [timeFrame, setTimeFrame] = useState({ startTime: '00:00:00', endTime: '00:30:00' });

    console.log('Habits prop in Create:', habits);

    const getMaxDayInRange = (startDate, endDate) => {
        if (!startDate || !endDate) return 31;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let maxDay = 31;
        let current = new Date(start);
        while (current <= end) {
            const year = current.getFullYear();
            const month = current.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            maxDay = Math.min(maxDay, daysInMonth);
            current.setMonth(current.getMonth() + 1);
        }
        return maxDay;
    };

    const checkTimeConflict = (newHabit, habits) => {
        console.log('Checking time conflict with habits:', habits);
        if (!Array.isArray(habits) || habits.length === 0) {
            console.warn('No valid habits to check for conflicts');
            return null;
        }

        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStartMinutes = timeToMinutes(newHabit.type === 'daily' ? newHabit.frequency.startTime : timeFrame.startTime);
        const newEndMinutes = timeToMinutes(newHabit.type === 'daily' ? newHabit.frequency.endTime : timeFrame.endTime);

        const newStartDt = new Date(newHabit.startDate).getTime();
        const newEndDt = new Date(newHabit.endDate).getTime();

        for (const habit of habits) {
            if (habit.userId !== newHabit.userId) {
                console.log('Skipping habit with different userId:', habit.name);
                continue;
            }

            const habitStartDt = new Date(habit.startDate).getTime();
            const habitEndDt = new Date(habit.endDate).getTime();

            console.log('Comparing with habit:', { name: habit.name, startDate: habit.startDate, endDate: habit.endDate, type: habit.type });

            if (newStartDt > habitEndDt || newEndDt < habitStartDt) {
                console.log('No date overlap with:', habit.name);
                continue;
            }

            if (habit.type === 'daily') {
                if (newHabit.type === 'daily') {
                    const habitStartMinutes = timeToMinutes(habit.frequency.startTime);
                    const habitEndMinutes = timeToMinutes(habit.frequency.endTime);
                    if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                        console.log('Time conflict detected with:', habit.name);
                        return `Time conflict with "${habit.name}" on daily schedule (${habit.frequency.startTime} - ${habit.frequency.endTime})`;
                    } else {
                        console.log('No time overlap with:', habit.name, { newStart: newStartMinutes, newEnd: newEndMinutes, habitStart: habitStartMinutes, habitEnd: habitEndMinutes });
                    }
                } else if (newHabit.type === 'weekly') {
                    for (const day of weeklyDays) {
                        const habitStartMinutes = timeToMinutes(habit.frequency.startTime);
                        const habitEndMinutes = timeToMinutes(habit.frequency.endTime);
                        if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                            console.log('Time conflict detected with:', habit.name);
                            return `Time conflict with "${habit.name}" on daily schedule (${habit.frequency.startTime} - ${habit.frequency.endTime}) for weekday ${day}`;
                        }
                    }
                } else if (newHabit.type === 'monthly') {
                    for (const day of monthlyDays) {
                        const habitStartMinutes = timeToMinutes(habit.frequency.startTime);
                        const habitEndMinutes = timeToMinutes(habit.frequency.endTime);
                        if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                            console.log('Time conflict detected with:', habit.name);
                            return `Time conflict with "${habit.name}" on daily schedule (${habit.frequency.startTime} - ${habit.frequency.endTime}) for day ${day}`;
                        }
                    }
                }
            } else if (habit.type === 'weekly') {
                if (newHabit.type === 'daily') {
                    for (const f of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(f.startTime);
                        const habitEndMinutes = timeToMinutes(f.endTime);
                        if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                            console.log('Time conflict detected with:', habit.name);
                            return `Time conflict with "${habit.name}" on weekday ${f.weekday} (${f.startTime} - ${f.endTime})`;
                        }
                    }
                } else if (newHabit.type === 'weekly') {
                    for (const day of weeklyDays) {
                        for (const f of habit.frequency) {
                            if (day === f.weekday) {
                                const habitStartMinutes = timeToMinutes(f.startTime);
                                const habitEndMinutes = timeToMinutes(f.endTime);
                                if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                                    console.log('Time conflict detected with:', habit.name);
                                    return `Time conflict with "${habit.name}" on weekday ${f.weekday} (${f.startTime} - ${f.endTime})`;
                                }
                            }
                        }
                    }
                } else if (newHabit.type === 'monthly') {
                    for (const day of monthlyDays) {
                        for (const f of habit.frequency) {
                            const habitStartMinutes = timeToMinutes(f.startTime);
                            const habitEndMinutes = timeToMinutes(f.endTime);
                            if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                                console.log('Time conflict detected with:', habit.name);
                                return `Time conflict with "${habit.name}" on weekday ${f.weekday} (${f.startTime} - ${f.endTime}) for day ${day}`;
                            }
                        }
                    }
                }
            } else if (habit.type === 'monthly') {
                if (newHabit.type === 'daily') {
                    for (const f of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(f.startTime);
                        const habitEndMinutes = timeToMinutes(f.endTime);
                        if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                            console.log('Time conflict detected with:', habit.name);
                            return `Time conflict with "${habit.name}" on day ${f.day} (${f.startTime} - ${f.endTime})`;
                        }
                    }
                } else if (newHabit.type === 'weekly') {
                    for (const day of weeklyDays) {
                        for (const f of habit.frequency) {
                            const habitStartMinutes = timeToMinutes(f.startTime);
                            const habitEndMinutes = timeToMinutes(f.endTime);
                            if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                                console.log('Time conflict detected with:', habit.name);
                                return `Time conflict with "${habit.name}" on day ${f.day} (${f.startTime} - ${f.endTime}) for weekday ${day}`;
                            }
                        }
                    }
                } else if (newHabit.type === 'monthly') {
                    for (const day of monthlyDays) {
                        for (const f of habit.frequency) {
                            if (day === f.day) {
                                const habitStartMinutes = timeToMinutes(f.startTime);
                                const habitEndMinutes = timeToMinutes(f.endTime);
                                if (newStartMinutes < habitEndMinutes && newEndMinutes > habitStartMinutes) {
                                    console.log('Time conflict detected with:', habit.name);
                                    return `Time conflict with "${habit.name}" on day ${f.day} (${f.startTime} - ${f.endTime})`;
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log('No time conflict detected');
        return null;
    };

    const handleCreateHabit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('Please log in to create a habit');
            console.error('No user logged in');
            return;
        }

        if (!newHabit.name.trim()) {
            setError('Habit name is required');
            console.error('Validation failed: Habit name is empty');
            return;
        }

        if (newHabit.startDate && newHabit.endDate && newHabit.startDate > newHabit.endDate) {
            setError('Start date must be before or equal to end date');
            console.error('Validation failed: startDate > endDate', { startDate: newHabit.startDate, endDate: newHabit.endDate });
            return;
        }

        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
        const newStartMinutes = timeToMinutes(newHabit.type === 'daily' ? newHabit.frequency.startTime : timeFrame.startTime);
        const newEndMinutes = timeToMinutes(newHabit.type === 'daily' ? newHabit.frequency.endTime : timeFrame.endTime);
        if (newStartMinutes >= newEndMinutes) {
            setError('Start time must be before end time');
            console.error('Validation failed: startTime >= endTime', {
                startTime: newHabit.type === 'daily' ? newHabit.frequency.startTime : timeFrame.startTime,
                endTime: newHabit.type === 'daily' ? newHabit.frequency.endTime : timeFrame.endTime
            });
            return;
        }

        const conflictError = checkTimeConflict(newHabit, habits);
        if (conflictError) {
            setError(conflictError);
            console.error('Validation failed: Time conflict', conflictError);
            return;
        }

        if (newHabit.type === 'weekly' && weeklyDays.length === 0) {
            setError('Please select at least one day for weekly habit');
            console.error('Validation failed: No weekdays selected');
            return;
        }
        if (newHabit.type === 'monthly' && monthlyDays.length === 0) {
            setError('Please select at least one day for monthly habit');
            console.error('Validation failed: No monthly days selected');
            return;
        }

        setLoading(true);
        try {
            let formattedHabit = { ...newHabit, userId: user.id };
            if (newHabit.type === 'weekly') {
                formattedHabit.frequency = weeklyDays.map(day => ({
                    weekday: day,
                    startTime: timeFrame.startTime,
                    endTime: timeFrame.endTime
                }));
            } else if (newHabit.type === 'monthly') {
                formattedHabit.frequency = monthlyDays.map(day => ({
                    day: parseInt(day),
                    startTime: timeFrame.startTime,
                    endTime: timeFrame.endTime
                }));
            }
            console.log('Sending habit to API:', formattedHabit);
            const createdHabit = await createHabit(formattedHabit);
            console.log('Habit created successfully:', createdHabit);
            setHabits(prev => [...prev, createdHabit]);
            setFilteredHabits(prev => [...prev, createdHabit]);
            setNewHabit({
                name: '',
                description: '',
                type: 'daily',
                frequency: { startTime: '00:00:00', endTime: '00:30:00' },
                startDate: '',
                endDate: '',
                priority: 'medium',
                isActive: true,
                userId: user.id
            });
            setWeeklyDays([]);
            setMonthlyDays([]);
            setTimeFrame({ startTime: '00:00:00', endTime: '00:30:00' });
            setShowCreateModal(false);
            setSuccess('Habit created successfully');
            setTimeout(() => setSuccess(null), 3000);
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create habit';
            setError(errorMessage);
            console.error('Error creating habit:', errorMessage, err);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (type) => {
        setNewHabit({
            ...newHabit,
            type,
            frequency: type === 'daily' ? { startTime: '00:00:00', endTime: '00:30:00' } : []
        });
        setWeeklyDays([]);
        setMonthlyDays([]);
    };

    const toggleWeeklyDay = (day) => {
        setWeeklyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleMonthlyDayChange = (e) => {
        const day = parseInt(e.target.value);
        const maxDay = getMaxDayInRange(newHabit.startDate, newHabit.endDate);
        if (day >= 1 && day <= maxDay) {
            setMonthlyDays(prev =>
                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            );
        } else {
            setError(`Day must be between 1 and ${maxDay} based on the selected date range`);
            console.error('Validation failed: Invalid monthly day', { day, maxDay });
        }
    };

    return (
        <>
            <Button variant="success" onClick={() => setShowCreateModal(true)} disabled={loading}>
                +
            </Button>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} className="pt-5 mt-5">
                <Modal.Header closeButton>
                    <Modal.Title>Create New Habit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateHabit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Habit Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newHabit.name}
                                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={newHabit.description}
                                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                value={newHabit.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                disabled={loading}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </Form.Select>
                        </Form.Group>
                        {newHabit.type === 'daily' && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={newHabit.frequency.startTime.slice(0, 5)}
                                        onChange={(e) =>
                                            setNewHabit({
                                                ...newHabit,
                                                frequency: { ...newHabit.frequency, startTime: `${e.target.value}:00` }
                                            })
                                        }
                                        disabled={loading}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={newHabit.frequency.endTime.slice(0, 5)}
                                        onChange={(e) =>
                                            setNewHabit({
                                                ...newHabit,
                                                frequency: { ...newHabit.frequency, endTime: `${e.target.value}:00` }
                                            })
                                        }
                                        disabled={loading}
                                    />
                                </Form.Group>
                            </>
                        )}
                        {newHabit.type === 'weekly' && (
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
                        {newHabit.type === 'monthly' && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Days of Month (1-{getMaxDayInRange(newHabit.startDate, newHabit.endDate)})</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max={getMaxDayInRange(newHabit.startDate, newHabit.endDate)}
                                        onChange={handleMonthlyDayChange}
                                        disabled={loading}
                                        placeholder={`Enter day (1-${getMaxDayInRange(newHabit.startDate, newHabit.endDate)})`}
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
                                value={newHabit.startDate}
                                onChange={(e) => setNewHabit({ ...newHabit, startDate: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={newHabit.endDate}
                                onChange={(e) => setNewHabit({ ...newHabit, endDate: e.target.value })}
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={newHabit.priority}
                                onChange={(e) => setNewHabit({ ...newHabit, priority: e.target.value })}
                                disabled={loading}
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </Form.Select>
                        </Form.Group>
                        <Button type="submit" variant="success" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'C reate Habit'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}