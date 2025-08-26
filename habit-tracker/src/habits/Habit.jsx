import React, { useState, useEffect } from 'react';
import { getHabits, createHabit, updateHabit, deleteHabit } from '../services/habitService';
import { useAuth } from '../context/AuthContext';
import { Button, Form, Card, Badge, Spinner, Alert, Modal, Col, Row } from 'react-bootstrap';
import { Pencil, Trash2 } from 'lucide-react';

export default function Habit() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentHabit, setCurrentHabit] = useState(null);
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

  const handleEditHabit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to edit a habit');
      return;
    }
    setLoading(true);
    try {
      const updatedHabit = await updateHabit(currentHabit.id, currentHabit);
      setHabits(habits.map((h) => (h.id === currentHabit.id ? updatedHabit : h)));
      setFilteredHabits(filteredHabits.map((h) => (h.id === currentHabit.id ? updatedHabit : h)));
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

  const handleToggleActive = async (id, currentStatus, habit) => {
    try {
      const updatedHabit = await updateHabit(id, { ...habit, isActive: !currentStatus });
      setHabits(habits.map((h) => (h.id === id ? updatedHabit : h)));
      setFilteredHabits(filteredHabits.map((h) => (h.id === id ? updatedHabit : h)));
      setSuccess(`Habit status changed to ${!currentStatus ? 'Active' : 'Inactive'}`);
      setTimeout(() => setSuccess(null), 3000);
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
        setSuccess('Habit deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
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

  const openEditModal = (habit) => {
    setCurrentHabit({ ...habit });
    setShowEditModal(true);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Habits</h2>
          <p className="fs-6">Manage and track your daily habits</p>
        </div>
        {user && (
          <Button variant="success" onClick={() => setShowCreateModal(true)}>
            +
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

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
                  <option value="low">Low</option>
                </Form.Select>
              </Form.Group>
            </div>
          </Form>

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
                      onChange={(e) => setCurrentHabit({ ...newHabit, priority: e.target.value })}
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

          {loading && (!filteredHabits || filteredHabits.length === 0) ? (
            <Spinner animation="border" />
          ) : (
            <Row xs={1} md={3} className="g-4">
              {filteredHabits && filteredHabits.map((habit) => (
                <Col key={habit.id}>
                  <Card style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                    <Card.Header style={{ backgroundColor: '#e9ecef', padding: '0', border: 'none' }}>
                      <div className="d-flex justify-content-between align-items-center p-2">
                        <Card.Title style={{ margin: '0' }}>
                          {habit.name}
                        </Card.Title>
                        <div>
                          <Button
                            variant="warning"
                            onClick={() => openEditModal(habit)}
                            disabled={loading}
                            className="p-1 me-2"
                          >
                            <Pencil size={20} />
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteHabit(habit.id)}
                            disabled={loading}
                            className="p-1"
                          >
                            <Trash2 size={20} />
                          </Button>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body style={{ flex: '1' }}>
                      <Card.Text>
                        <strong>Description:</strong> {habit.description || 'No description'}<br />
                        <div>
                          <strong>Type:</strong> {habit.type} - <strong>Frequency:</strong> {habit.frequency}
                        </div>
                        <strong>Priority:</strong> {' '}
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
                        </Badge><br />
                        <strong>Status:</strong> {' '}
                        <Form.Check
                          type="switch"
                          checked={habit.isActive}
                          onChange={() => handleToggleActive(habit.id, habit.isActive, habit)}
                          disabled={loading}
                          inline
                        />
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </div>
  );
}