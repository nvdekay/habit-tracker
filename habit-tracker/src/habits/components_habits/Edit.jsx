import React, { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { updateHabit } from '../../services/habitService';
import { Pencil } from 'lucide-react';

export default function Edit({ habit, setHabits, setFilteredHabits, setSuccess, setError, loading, setLoading }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentHabit, setCurrentHabit] = useState(habit);

    const handleEditHabit = async (e) => {
        e.preventDefault();
        if (!habit.userId) {
            setError('Please log in to edit a habit');
            return;
        }
        setLoading(true);
        try {
            const updatedHabit = await updateHabit(currentHabit.id, currentHabit);
            setHabits(prev => prev.map((h) => (h.id === currentHabit.id ? updatedHabit : h)));
            setFilteredHabits(prev => prev.map((h) => (h.id === currentHabit.id ? updatedHabit : h)));
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
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, type: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Frequency</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={currentHabit.frequency}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, frequency: parseInt(e.target.value) })}
                                    min="1"
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
                            <Form.Group className="mb-3">
                                <Form.Label>Current Streak</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={currentHabit.currentStreak || 0}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, currentStreak: parseInt(e.target.value) })}
                                    min="0"
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Longest Streak</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={currentHabit.longestStreak || 0}
                                    onChange={(e) => setCurrentHabit({ ...currentHabit, longestStreak: parseInt(e.target.value) })}
                                    min="0"
                                    disabled={loading}
                                />
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