import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Clock, AlertTriangle } from 'lucide-react';
import { updateHabit } from '../../services/habitService';

const TimeConflictModal = ({ show, onHide, conflictingHabits, selectedDate, onResolve }) => {
    const [updating, setUpdating] = useState(false);
    const [selectedHabitId, setSelectedHabitId] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [error, setError] = useState('');

    const handleResolve = async () => {
        if (!selectedHabitId || !newStartTime || !newEndTime) {
            setError('Please select a habit and provide new time');
            return;
        }

        if (newStartTime >= newEndTime) {
            setError('End time must be after start time');
            return;
        }

        try {
            setUpdating(true);
            setError('');

            // Find the selected habit
            const habitToUpdate = conflictingHabits.find(h => h.id === selectedHabitId);
            
            // Update the habit's time
            const updatedHabit = {
                ...habitToUpdate,
                frequency: habitToUpdate.type === 'daily' 
                    ? {
                        ...habitToUpdate.frequency,
                        startTime: newStartTime + ':00',
                        endTime: newEndTime + ':00'
                    }
                    : habitToUpdate.frequency.map(freq => ({
                        ...freq,
                        startTime: newStartTime + ':00',
                        endTime: newEndTime + ':00'
                    }))
            };

            await updateHabit(habitToUpdate.id, updatedHabit);
            
            // Call onResolve callback
            if (onResolve) {
                onResolve();
            }
            
            onHide();
        } catch (error) {
            console.error('Failed to update habit time:', error);
            setError('Failed to update habit time. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5); // Remove seconds
    };

    const getHabitTime = (habit) => {
        if (habit.type === 'daily') {
            return `${formatTime(habit.frequency.startTime)} - ${formatTime(habit.frequency.endTime)}`;
        } else if (habit.type === 'weekly' && habit.frequency.length > 0) {
            return `${formatTime(habit.frequency[0].startTime)} - ${formatTime(habit.frequency[0].endTime)}`;
        }
        return 'No time set';
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center">
                    <AlertTriangle size={24} className="me-2 text-warning" />
                    Time Conflict Detected
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <Alert variant="warning" className="mb-4">
                    <strong>Multiple habits are scheduled at the same time!</strong>
                    <br />
                    Please adjust the time for one of the conflicting habits to resolve this issue.
                </Alert>

                <div className="mb-4">
                    <h6 className="mb-3">Conflicting Habits:</h6>
                    {conflictingHabits.map(habit => (
                        <div 
                            key={habit.id} 
                            className="d-flex justify-content-between align-items-center p-3 border rounded mb-2"
                            style={{ backgroundColor: '#f8f9fa' }}
                        >
                            <div className="d-flex align-items-center">
                                <div 
                                    className="conflict-indicator me-3"
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: '#dc3545',
                                        flexShrink: 0
                                    }}
                                />
                                <div>
                                    <strong>{habit.name}</strong>
                                    <div className="text-muted small">{habit.description}</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center text-muted">
                                <Clock size={16} className="me-1" />
                                {getHabitTime(habit)}
                            </div>
                        </div>
                    ))}
                </div>

                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Select habit to modify:</Form.Label>
                        <Form.Select 
                            value={selectedHabitId} 
                            onChange={(e) => setSelectedHabitId(e.target.value)}
                        >
                            <option value="">Choose a habit...</option>
                            {conflictingHabits.map(habit => (
                                <option key={habit.id} value={habit.id}>
                                    {habit.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>New Start Time:</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={newStartTime}
                                    onChange={(e) => setNewStartTime(e.target.value)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>New End Time:</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={updating}>
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleResolve}
                    disabled={updating || !selectedHabitId}
                >
                    {updating ? (
                        <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            Updating...
                        </>
                    ) : (
                        'Resolve Conflict'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TimeConflictModal;