import React, { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { createHabit } from '../../services/habitService';

export default function Create({ user, setHabits, setFilteredHabits, setSuccess, setError, loading, setLoading }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newHabit, setNewHabit] = useState({
        name: '',
        description: '',
        type: 'daily',
        frequency: 1,
        priority: 'medium',
        isActive: true,
        userId: user ? user.id : ''
    });

    const handleCreateHabit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('Please log in to create a habit');
            return;
        }
        setLoading(true);
        try {
            const createdHabit = await createHabit({ ...newHabit, userId: user.id });
            setHabits(prev => [...prev, createdHabit]);
            setFilteredHabits(prev => [...prev, createdHabit]);
            setNewHabit({
                name: '',
                description: '',
                type: 'daily',
                frequency: 1,
                priority: 'medium',
                isActive: true,
                userId: user.id
            });
            setShowCreateModal(false);
            setSuccess('Habit created successfully');
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
            <Button variant="success" onClick={() => setShowCreateModal(true)} disabled={loading}>
                +
            </Button>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} className='pt-5 mt-5'>
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
                                onChange={(e) => setNewHabit({ ...newHabit, type: e.target.value })}
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
                                value={newHabit.frequency}
                                onChange={(e) => setNewHabit({ ...newHabit, frequency: parseInt(e.target.value) })}
                                min="1"
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
                            {loading ? <Spinner animation="border" size="sm" /> : 'Create Habit'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}