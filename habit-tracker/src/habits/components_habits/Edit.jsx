import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { updateHabit } from '../../services/habitService';
import { Pencil } from 'lucide-react';

export default function Edit({ habit, setHabits, setFilteredHabits, setSuccess, setError, loading, setLoading, habits }) {
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

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        console.log('Habits received in Edit:', habits);
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
    }, [habit, habits]);

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
        console.log('New habit input in Edit:', JSON.stringify(newHabitData, null, 2));
        console.log('Existing habits count in Edit:', existingHabits?.length);
        if (!Array.isArray(existingHabits) || existingHabits.length === 0) {
            console.log('No existing habits to check for conflicts in Edit.');
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
        console.log(`New habit time: ${newStartMinutes}-${newEndMinutes} (${newHabitData.frequency.startTime || timeFrame.startTime}-${newHabitData.frequency.endTime || timeFrame.endTime})`);

        const newStartDate = new Date(newHabitData.startDate);
        const newEndDate = newHabitData.endDate ? new Date(newHabitData.endDate) : new Date('9999-12-31');

        for (const habit of existingHabits) {
            if (habit.id === newHabitData.id) {
                console.log(`Skipping habit ${habit.name}: same ID as current habit`);
                continue;
            }
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

        console.log('No conflicts found after checking all habits in Edit.');
        return null;
    };

    const getDayName = (dayNumber) => {
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayNumber] || `Day ${dayNumber}`;
    };

    const handleEditHabit = async (e) => {
        e.preventDefault();
        console.log('Submitting edited habit:', JSON.stringify(currentHabit, null, 2));
        console.log('Habits received for conflict check:', habits);

        if (!currentHabit.userId) {
            setError('Please log in to edit a habit');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (!currentHabit.name.trim()) {
            setError('Habit name is required');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (currentHabit.startDate && currentHabit.endDate && currentHabit.startDate > currentHabit.endDate) {
            setError('Start date must be before or equal to end date');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (currentHabit.startDate && currentHabit.startDate < today) {
            setError('Start date must be today or later');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (currentHabit.endDate && currentHabit.endDate < today) {
            setError('End date must be today or later');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
        const newStartMinutes = timeToMinutes(currentHabit.type === 'daily' ? currentHabit.frequency.startTime : timeFrame.startTime);
        const newEndMinutes = timeToMinutes(currentHabit.type === 'daily' ? currentHabit.frequency.endTime : timeFrame.endTime);
        if (newStartMinutes >= newEndMinutes) {
            setError('Start time must be before end time');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (currentHabit.type === 'weekly' && weeklyDays.length === 0) {
            setError('Please select at least one day for weekly habit');
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (currentHabit.type === 'monthly' && monthlyDays.length === 0) {
            setError('Please select at least one day for monthly habit');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const conflictError = checkTimeConflict(currentHabit, habits || []);
        if (conflictError) {
            setError(conflictError);
            setTimeout(() => setError(null), 3000);
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
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update habit';
            setError(errorMessage);
            setTimeout(() => setError(null), 3000);
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
        const day = parseInt(e.target.value);
        const maxDay = getMaxDayInRange(currentHabit.startDate, currentHabit.endDate);
        if (day >= 1 && day <= maxDay) {
            setMonthlyDays(prev =>
                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            );
        } else {
            setError(`Day must be between 1 and ${maxDay} based on the selected date range`);
            setTimeout(() => setError(null), 3000);
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
                                        <Form.Label>Days of Month (1-{getMaxDayInRange(currentHabit.startDate, currentHabit.endDate)})</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max={getMaxDayInRange(currentHabit.startDate, currentHabit.endDate)}
                                            onChange={handleMonthlyDayChange}
                                            disabled={loading}
                                            placeholder={`Enter day (1-${getMaxDayInRange(currentHabit.startDate, currentHabit.endDate)})`}
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
                                    min={today}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={currentHabit.endDate}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, endDate: e.target.value })}
                                    disabled={loading}
                                    min={currentHabit.startDate || today}
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
