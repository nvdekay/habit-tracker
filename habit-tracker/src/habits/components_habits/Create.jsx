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

    // Helper function to transform component data to Supabase format
    const transformToSupabaseFormat = (habitData) => ({
        name: habitData.name,
        description: habitData.description,
        type: habitData.type,
        frequency: habitData.frequency,
        startDate: habitData.startDate, // Will be converted to start_date in service
        endDate: habitData.endDate, // Will be converted to end_date in service
        priority: habitData.priority,
        isActive: habitData.isActive, // Will be converted to is_active in service
        isInGoals: habitData.isInGoals || false
    });

    // Helper function to transform Supabase data to component format
    const transformFromSupabaseFormat = (supabaseData) => ({
        id: supabaseData.id,
        name: supabaseData.name,
        description: supabaseData.description,
        type: supabaseData.type,
        frequency: supabaseData.frequency,
        startDate: supabaseData.start_date,
        endDate: supabaseData.end_date,
        priority: supabaseData.priority,
        isActive: supabaseData.is_active,
        isInGoals: supabaseData.is_in_goals,
        userId: supabaseData.user_id,
        createdAt: supabaseData.created_at,
        updatedAt: supabaseData.updated_at
    });

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

    const getAvailableWeekdays = (startDate, endDate) => {
        if (!startDate) return [1, 2, 3, 4, 5, 6, 7];
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date('9999-12-31');
        const weekdays = new Set();
        let current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay() || 7;
            weekdays.add(dayOfWeek);
            current.setDate(current.getDate() + 1);
        }
        return Array.from(weekdays).sort((a, b) => a - b);
    };

    const getAvailableMonthlyDays = (startDate, endDate) => {
        const maxDay = getMaxDayInRange(startDate, endDate);
        return Array.from({ length: maxDay }, (_, i) => i + 1);
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

        if (newHabit.type === 'weekly') {
            const availableWeekdays = getAvailableWeekdays(newHabit.startDate, newHabit.endDate);
            if (weeklyDays.some(day => !availableWeekdays.includes(day))) {
                setError('Selected days of week are not within the date range');
                return;
            }
        }

        if (newHabit.type === 'monthly') {
            const availableMonthlyDays = getAvailableMonthlyDays(newHabit.startDate, newHabit.endDate);
            if (monthlyDays.some(day => !availableMonthlyDays.includes(day))) {
                setError('Selected days of month are not within the date range');
                return;
            }
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

            // Transform to Supabase format
            const supabaseFormatHabit = transformToSupabaseFormat(formattedHabit);
            const response = await createHabit(supabaseFormatHabit);
            
            if (response.success) {
                const createdHabit = transformFromSupabaseFormat(response.data);
                setHabits(prev => [...prev, createdHabit]);
                setFilteredHabits(prev => [...prev, createdHabit]);
                
                // Reset form
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
                setSuccess(response.message || 'Habit created successfully');
                setTimeout(() => setSuccess(null), 3000);
                setError(null);
            } else {
                throw new Error(response.message || 'Failed to create habit');
            }
        } catch (err) {
            console.error("Create habit error:", err);
            setError(err.message || 'Failed to create habit');
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
        const availableWeekdays = getAvailableWeekdays(newHabit.startDate, newHabit.endDate);
        if (!availableWeekdays.includes(day)) {
            setError(`Day ${getDayName(day)} is not available in the selected date range`);
            return;
        }
        setWeeklyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleMonthlyDay = (day) => {
        const availableMonthlyDays = getAvailableMonthlyDays(newHabit.startDate, newHabit.endDate);
        if (!availableMonthlyDays.includes(day)) {
            setError(`Day ${day} is not available in the selected date range`);
            return;
        }
        setMonthlyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleMonthlyDayChange = (e) => {
        const day = parseInt(e.target.value);
        const availableMonthlyDays = getAvailableMonthlyDays(newHabit.startDate, newHabit.endDate);
        if (day >= 1 && day <= availableMonthlyDays.length) {
            setMonthlyDays(prev =>
                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            );
        } else {
            setError(`Day must be between 1 and ${availableMonthlyDays.length} based on the selected date range`);
        }
    };

    return (
        <>
            <Button variant="success" onClick={() => setShowCreateModal(true)} disabled={loading}>
                +
            </Button>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
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
                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={newHabit.startDate}
                                onChange={(e) => {
                                    setNewHabit({ ...newHabit, startDate: e.target.value });
                                    setWeeklyDays([]);
                                    setMonthlyDays([]);
                                }}
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
                                onChange={(e) => {
                                    setNewHabit({ ...newHabit, endDate: e.target.value });
                                    setWeeklyDays([]);
                                    setMonthlyDays([]);
                                }}
                                disabled={loading}
                                min={newHabit.startDate || today}
                            />
                        </Form.Group>
                        {newHabit.type === 'weekly' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Days of Week</Form.Label>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, index) => {
                                    const dayIndex = index + 1;
                                    const availableWeekdays = getAvailableWeekdays(newHabit.startDate, newHabit.endDate);
                                    return (
                                        <Form.Check
                                            key={dayIndex}
                                            type="checkbox"
                                            label={dayName}
                                            checked={weeklyDays.includes(dayIndex)}
                                            onChange={() => toggleWeeklyDay(dayIndex)}
                                            disabled={loading || !availableWeekdays.includes(dayIndex)}
                                        />
                                    );
                                })}
                            </Form.Group>
                        )}
                        {newHabit.type === 'monthly' && (
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
                                <Form.Label className="mt-2">Selected Days</Form.Label>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                                    {getAvailableMonthlyDays(newHabit.startDate, newHabit.endDate).map((day) => (
                                        <Form.Check
                                            key={day}
                                            type="checkbox"
                                            label={day}
                                            checked={monthlyDays.includes(day)}
                                            onChange={() => toggleMonthlyDay(day)}
                                            disabled={loading}
                                            style={{ margin: '0' }}
                                        />
                                    ))}
                                </div>
                                {monthlyDays.length === 0 && <div className="mt-2">No days selected</div>}
                            </Form.Group>
                        )}
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
                        {(newHabit.type === 'weekly' || newHabit.type === 'monthly') && (
                            <>
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