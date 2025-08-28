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

    const today = new Date().toISOString().split('T')[0];

    const getMaxDayInRange = (startDate, endDate) => {
        if (!startDate) return 31;
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date('9999-12-31');
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

    const checkTimeConflict = (newHabitData, existingHabits) => {
        if (!Array.isArray(existingHabits) || existingHabits.length === 0) {
            console.log('No existing habits to check for conflicts.');
            return null;
        }

        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const hasTimeOverlap = (start1, end1, start2, end2) => {
            const overlap = start1 < end2 && end1 > start2;
            console.log(`Time overlap check: ${start1}-${end1} vs ${start2}-${end2} -> ${overlap}`);
            return overlap;
        };

        let newStartMinutes, newEndMinutes;
        if (newHabitData.type === 'daily') {
            newStartMinutes = timeToMinutes(newHabitData.frequency.startTime);
            newEndMinutes = timeToMinutes(newHabitData.frequency.endTime);
        } else {
            newStartMinutes = timeToMinutes(timeFrame.startTime);
            newEndMinutes = timeToMinutes(timeFrame.endTime);
        }
        console.log(`New habit time: ${newStartMinutes}-${newEndMinutes} (${newHabitData.frequency.startTime}-${newHabitData.frequency.endTime})`);

        const newStartDate = new Date(newHabitData.startDate);
        const newEndDate = newHabitData.endDate ? new Date(newHabitData.endDate) : new Date('9999-12-31');

        for (const habit of existingHabits) {
            if (habit.userId !== newHabitData.userId) {
                console.log(`Skipping habit ${habit.name}: different userId`);
                continue;
            }

            const habitStartDate = new Date(habit.startDate);
            const habitEndDate = habit.endDate ? new Date(habit.endDate) : new Date('9999-12-31');

            const hasDateOverlap = newStartDate <= habitEndDate && newEndDate >= habitStartDate;
            console.log(`Checking ${habit.name} (ID: ${habit.id}): Date overlap = ${hasDateOverlap} (new: ${newHabitData.startDate}-${newHabitData.endDate || 'infinity'}, habit: ${habit.startDate}-${habit.endDate || 'infinity'})`);

            if (!hasDateOverlap) {
                console.log(`No date overlap with ${habit.name}, skipping time check.`);
                continue;
            }

            if (habit.type === 'daily') {
                const habitStartMinutes = timeToMinutes(habit.frequency.startTime);
                const habitEndMinutes = timeToMinutes(habit.frequency.endTime);

                if (newHabitData.type === 'daily') {
                    if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                        console.log(`Conflict detected with daily habit ${habit.name}`);
                        return `Time conflict with "${habit.name}" (${habit.frequency.startTime.slice(0, 5)} - ${habit.frequency.endTime.slice(0, 5)})`;
                    }
                } else if (newHabitData.type === 'weekly' && weeklyDays.length > 0) {
                    if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                        console.log(`Conflict detected with daily habit ${habit.name} for weekly habit`);
                        return `Time conflict with daily habit "${habit.name}" (${habit.frequency.startTime.slice(0, 5)} - ${habit.frequency.endTime.slice(0, 5)})`;
                    }
                } else if (newHabitData.type === 'monthly' && monthlyDays.length > 0) {
                    if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                        console.log(`Conflict detected with daily habit ${habit.name} for monthly habit`);
                        return `Time conflict with daily habit "${habit.name}" (${habit.frequency.startTime.slice(0, 5)} - ${habit.frequency.endTime.slice(0, 5)})`;
                    }
                }
            } else if (habit.type === 'weekly') {
                if (newHabitData.type === 'daily') {
                    for (const freq of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(freq.startTime);
                        const habitEndMinutes = timeToMinutes(freq.endTime);
                        if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                            console.log(`Conflict detected with weekly habit ${habit.name} on ${getDayName(freq.weekday)}`);
                            return `Time conflict with weekly habit "${habit.name}" on ${getDayName(freq.weekday)} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                        }
                    }
                } else if (newHabitData.type === 'weekly') {
                    for (const newDay of weeklyDays) {
                        for (const freq of habit.frequency) {
                            if (newDay === freq.weekday) {
                                const habitStartMinutes = timeToMinutes(freq.startTime);
                                const habitEndMinutes = timeToMinutes(freq.endTime);
                                if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                                    console.log(`Conflict detected with weekly habit ${habit.name} on ${getDayName(freq.weekday)}`);
                                    return `Time conflict with "${habit.name}" on ${getDayName(freq.weekday)} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                                }
                            }
                        }
                    }
                } else if (newHabitData.type === 'monthly') {
                    for (const freq of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(freq.startTime);
                        const habitEndMinutes = timeToMinutes(freq.endTime);
                        if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                            console.log(`Potential conflict detected with weekly habit ${habit.name} on ${getDayName(freq.weekday)}`);
                            return `Potential time conflict with weekly habit "${habit.name}" on ${getDayName(freq.weekday)} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                        }
                    }
                }
            } else if (habit.type === 'monthly') {
                if (newHabitData.type === 'daily') {
                    for (const freq of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(freq.startTime);
                        const habitEndMinutes = timeToMinutes(freq.endTime);
                        if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                            console.log(`Conflict detected with monthly habit ${habit.name} on day ${freq.day}`);
                            return `Time conflict with monthly habit "${habit.name}" on day ${freq.day} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                        }
                    }
                } else if (newHabitData.type === 'weekly') {
                    for (const freq of habit.frequency) {
                        const habitStartMinutes = timeToMinutes(freq.startTime);
                        const habitEndMinutes = timeToMinutes(freq.endTime);
                        if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                            console.log(`Potential conflict detected with monthly habit ${habit.name} on day ${freq.day}`);
                            return `Potential time conflict with monthly habit "${habit.name}" on day ${freq.day} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                        }
                    }
                } else if (newHabitData.type === 'monthly') {
                    for (const newDay of monthlyDays) {
                        for (const freq of habit.frequency) {
                            if (newDay === freq.day) {
                                const habitStartMinutes = timeToMinutes(freq.startTime);
                                const habitEndMinutes = timeToMinutes(freq.endTime);
                                if (hasTimeOverlap(newStartMinutes, newEndMinutes, habitStartMinutes, habitEndMinutes)) {
                                    console.log(`Conflict detected with monthly habit ${habit.name} on day ${freq.day}`);
                                    return `Time conflict with "${habit.name}" on day ${freq.day} (${freq.startTime.slice(0, 5)} - ${freq.endTime.slice(0, 5)})`;
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log('No conflicts found after checking all habits.');
        return null;
    };

    const getDayName = (dayNumber) => {
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayNumber] || `Day ${dayNumber}`;
    };

    const handleCreateHabit = async (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            setError('Please log in to create a habit');
            return;
        }

        if (!newHabit.name.trim()) {
            setError('Habit name is required');
            return;
        }

        if (newHabit.startDate && newHabit.endDate && newHabit.startDate > newHabit.endDate) {
            setError('Start date must be before or equal to end date');
            return;
        }

        if (newHabit.startDate && newHabit.startDate < today) {
            setError('Start date must be today or later');
            return;
        }

        if (newHabit.endDate && newHabit.endDate < today) {
            setError('End date must be today or later');
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
            return;
        }

        if (newHabit.type === 'weekly' && weeklyDays.length === 0) {
            setError('Please select at least one day for weekly habit');
            return;
        }
        if (newHabit.type === 'monthly' && monthlyDays.length === 0) {
            setError('Please select at least one day for monthly habit');
            return;
        }

        const conflictError = checkTimeConflict(newHabit, habits);
        if (conflictError) {
            setError(conflictError);
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
            const createdHabit = await createHabit(formattedHabit);
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
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create habit';
            setError(errorMessage);
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
        }
    };

    return (
        <>
            <Button variant="success" onClick={() => setShowCreateModal(true)} disabled={loading}>
                +
            </Button>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
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
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, index) => (
                                        <Form.Check
                                            key={index + 1}
                                            type="checkbox"
                                            label={dayName}
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
                                min={today}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={newHabit.endDate}
                                onChange={(e) => setNewHabit({ ...newHabit, endDate: e.target.value })}
                                disabled={loading}
                                min={newHabit.startDate || today}
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
                            {loading ? <Spinner animation="border" size="sm" /> : 'Create Habit'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}