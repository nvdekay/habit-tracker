import React, { useState, useEffect } from 'react';
import { getHabits, createHabit, updateHabit, deleteHabit } from '../services/habitService';
import { useAuth } from '../context/AuthContext';
import { Button, Form, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';

export default function Habit() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    isActive: '',
    priority: ''
  });
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    type: 'daily',
    frequency: 1,
    priority: 'medium',
    color: '#ffffff',
    isActive: true,
    userId: user ? user.id : ''
  });

  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
      setFilteredHabits([]);
      setError('Please log in to manage habits');
    }
  }, [user]);

  useEffect(() => {
    setFilteredHabits(
      habits.filter(habit =>
        (!filters.type || habit.type === filters.type) &&
        (filters.isActive === '' || habit.isActive === (filters.isActive === 'true')) &&
        (!filters.priority || habit.priority === filters.priority)
      )
    );
  }, [habits, filters]);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const habitData = await getHabits();
      const userHabits = Array.isArray(habitData) ? habitData.filter(habit => habit.userId === user.id) : [];
      setHabits(userHabits);
      setFilteredHabits(userHabits);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to create a habit');
      return;
    }
    setLoading(true);
    try {
      const createdHabit = await createHabit({ ...newHabit, userId: user.id });
      setHabits([...habits, createdHabit]);
      setFilteredHabits([...filteredHabits, createdHabit]);
      setNewHabit({
        name: '',
        description: '',
        type: 'daily',
        frequency: 1,
        priority: 'medium',
        color: '#ffffff',
        isActive: true,
        userId: user.id
      });
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, habit) => {
    try {
      const updatedHabit = await updateHabit(id, { ...habit, isActive: !currentStatus });
      setHabits(habits.map((h) => (h.id === id ? updatedHabit : h)));
      setFilteredHabits(filteredHabits.map((h) => (h.id === id ? updatedHabit : h)));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await deleteHabit(id);
        setHabits(habits.filter((h) => h.id !== id));
        setFilteredHabits(filteredHabits.filter((h) => h.id !== id));
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Habits</h2>
          <p className="fs-6">Manage and track your daily habits</p>
        </div>
        {user && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            +
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {!user ? (
        <Alert variant="warning">Please log in to use this feature.</Alert>
      ) : (
        <>
          <Form className="mb-4">
            <div className="d-flex gap-3">
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  disabled={loading}
                >
                  <option value="">All</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="isActive"
                  value={filters.isActive}
                  onChange={handleFilterChange}
                  disabled={loading}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  disabled={loading}
                >
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </Form.Select>
              </Form.Group>
            </div>
          </Form>

          <Modal show={showModal} onHide={() => setShowModal(false)}>
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
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={newHabit.color}
                    onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                    disabled={loading}
                  />
                </Form.Group>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Create Habit'}
                </Button>
              </Form>
            </Modal.Body>
          </Modal>

          {loading && (!filteredHabits || filteredHabits.length === 0) ? (
            <Spinner animation="border" />
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Frequency</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits && filteredHabits.map((habit) => (
                  <tr key={habit.id}>
                    <td>{habit.name}</td>
                    <td>{habit.description}</td>
                    <td>{habit.type}</td>
                    <td>{habit.frequency}</td>
                    <td>
                      <Badge
                        bg={
                          habit.priority === 'high'
                            ? 'danger'
                            : habit.priority === 'medium'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {habit.priority}
                      </Badge>
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={habit.isActive}
                        onChange={() => handleToggleActive(habit.id, habit.isActive, habit)}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteHabit(habit.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}