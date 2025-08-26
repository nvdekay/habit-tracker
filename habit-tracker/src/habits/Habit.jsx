import React, { useState, useEffect } from 'react';
import { getHabits, deleteHabit, updateHabit } from '../services/habitService';
import { useAuth } from '../context/AuthContext';
import { Button, Form, Card, Badge, Spinner, Alert, Col, Row } from 'react-bootstrap';
import { Pencil, Trash2 } from 'lucide-react';
import Create from './components_habits/Create';
import Edit from './components_habits/Edit';

export default function Habit() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    isActive: '',
    priority: []
  });
  const [sortBy, setSortBy] = useState('');

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
    let result = [...habits];

    result = result.filter(habit =>
      (!filters.search || habit.name.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.type || habit.type === filters.type) &&
      (filters.isActive === '' || habit.isActive === (filters.isActive === 'true')) &&
      (filters.priority.length === 0 || filters.priority.includes(habit.priority))
    );

    if (sortBy) {
      result.sort((a, b) => {
        const order = ['daily', 'weekly', 'monthly'];
        if (sortBy === 'type-asc') {
          return order.indexOf(a.type) - order.indexOf(b.type);
        } else if (sortBy === 'type-desc') {
          return order.indexOf(b.type) - order.indexOf(a.type);
        }
        return 0;
      });
    }

    setFilteredHabits(result);
  }, [habits, filters, sortBy]);

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
    const { name, value, checked } = e.target;
    if (name === 'priority') {
      setFilters(prev => ({
        ...prev,
        priority: checked
          ? [...prev.priority, value]
          : prev.priority.filter(p => p !== value)
      }));
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Habits</h2>
          <p className="fs-6">Manage and track your daily habits</p>
        </div>
        {user && (
          <Create
            user={user}
            setHabits={setHabits}
            setFilteredHabits={setFilteredHabits}
            setSuccess={setSuccess}
            setError={setError}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!user ? (
        <Alert variant="warning">Please log in to use this feature.</Alert>
      ) : (
        <>
          <Form className="mb-4">
            <div className="d-flex gap-3 flex-wrap">
              <Form.Group style={{ minWidth: '200px' }}>
                <Form.Label>Search by Name</Form.Label>
                <Form.Control
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Enter habit name"
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group style={{ minWidth: '200px' }}>
                <Form.Label>Sort by Type</Form.Label>
                <Form.Select
                  name="sortBy"
                  value={sortBy}
                  onChange={handleSortChange}
                  disabled={loading}
                >
                  <option value="">Default</option>
                  <option value="type-asc">Daily to Monthly</option>
                  <option value="type-desc">Monthly to Daily</option>
                </Form.Select>
              </Form.Group>
              <Form.Group style={{ minWidth: '200px' }}>
                <Form.Label>Status</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label="All"
                    name="isActive"
                    value=""
                    checked={filters.isActive === ''}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                  <Form.Check
                    type="radio"
                    label="Active"
                    name="isActive"
                    value="true"
                    checked={filters.isActive === 'true'}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                  <Form.Check
                    type="radio"
                    label="Inactive"
                    name="isActive"
                    value="false"
                    checked={filters.isActive === 'false'}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                </div>
              </Form.Group>
              <Form.Group style={{ minWidth: '200px' }}>
                <Form.Label>Priority</Form.Label>
                <div>
                  <Form.Check
                    type="checkbox"
                    label="High"
                    name="priority"
                    value="high"
                    checked={filters.priority.includes('high')}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                  <Form.Check
                    type="checkbox"
                    label="Medium"
                    name="priority"
                    value="medium"
                    checked={filters.priority.includes('medium')}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                  <Form.Check
                    type="checkbox"
                    label="Low"
                    name="priority"
                    value="low"
                    checked={filters.priority.includes('low')}
                    onChange={handleFilterChange}
                    disabled={loading}
                    inline
                  />
                </div>
              </Form.Group>
            </div>
          </Form>

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
                          <Edit
                            habit={habit}
                            setHabits={setHabits}
                            setFilteredHabits={setFilteredHabits}
                            setSuccess={setSuccess}
                            setError={setError}
                            loading={loading}
                            setLoading={setLoading}
                          />
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