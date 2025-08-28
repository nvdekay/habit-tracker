import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHabits, updateHabit, deleteHabit } from '../services/habitService';
import { Button, Form, Card, Badge, Spinner, Toast, ToastContainer, Col, Row, Container } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';
import Create from './components_habits/Create';
import Edit from './components_habits/Edit';

const Habit = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [sortOrder, setSortOrder] = useState('none');

  useEffect(() => {
    const fetchHabits = async () => {
      if (!user) {
        setHabits([]);
        setFilteredHabits([]);
        setError('Please log in to manage habits');
        return;
      }
      try {
        setLoading(true);
        const habitData = await getHabits(user.id);
        console.log('Fetched habits:', habitData);
        setHabits(habitData || []);
        setFilteredHabits(habitData || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching habits:", error);
        setError('Failed to fetch habits');
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, [user]);

  useEffect(() => {
    let result = habits;

    if (searchTerm.length > 0) {
      result = result.filter(habit =>
        habit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      result = result.filter(habit => habit.type === typeFilter);
    }

    if (statusFilter === 'true') {
      result = result.filter(habit => habit.isActive === true);
    } else if (statusFilter === 'false') {
      result = result.filter(habit => habit.isActive === false);
    }

    if (priorityFilter.length > 0) {
      result = result.filter(habit => priorityFilter.includes(habit.priority));
    }

    setFilteredHabits(result);
  }, [habits, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await deleteHabit(id);
        setHabits(habits.filter(habit => habit.id !== id));
        setFilteredHabits(filteredHabits.filter(habit => habit.id !== id));
        setSuccess('Habit deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        setError(null);
      } catch (error) {
        console.error("Error deleting habit:", error);
        setError('Failed to delete habit');
      }
    }
  };

  const handleToggleActive = async (id, currentStatus, habit) => {
    try {
      const updatedHabit = await updateHabit(id, { ...habit, isActive: !currentStatus });
      setHabits(habits.map(h => h.id === id ? updatedHabit : h));
      setFilteredHabits(filteredHabits.map(h => h.id === id ? updatedHabit : h));
      setSuccess(`Habit status changed to ${!currentStatus ? 'Active' : 'Inactive'}`);
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (error) {
      console.error("Error updating habit:", error);
      setError('Failed to update habit status');
    }
  };

  const togglePriority = (priority) => {
    setPriorityFilter(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const MySort = () => {
    var object = [...filteredHabits];
    if (sortOrder === 'asc') {
      setSortOrder('none');
      setFilteredHabits(habits);
    } else {
      object.sort((a, b) => {
        const typeOrder = ['daily', 'weekly', 'monthly'];
        const priorityOrder = ['high', 'medium', 'low'];

        if (a.type !== b.type) {
          return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        }

        if (a.priority !== b.priority) {
          return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        }

        return a.name.localeCompare(b.name);
      });
      setFilteredHabits(object);
      setSortOrder('asc');
    }
  };

  const formatFrequency = (habit) => {
    if (habit.type === 'daily') {
      return <div>Time: {habit.frequency.startTime} - {habit.frequency.endTime}</div>;
    } else if (habit.type === 'weekly') {
      const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return (
        <div>
          Time:
          {habit.frequency.map((f, index) => (
            <div key={index} className="ms-2">
              {weekdayNames[f.weekday - 1]} ({f.startTime} - {f.endTime})
            </div>
          ))}
        </div>
      );
    } else if (habit.type === 'monthly') {
      return (
        <div>
          Time:
          {habit.frequency.map((f, index) => (
            <div key={index} className="ms-2">
              Day {f.day} ({f.startTime} - {f.endTime})
            </div>
          ))}
        </div>
      );
    }
    return '';
  };

  return (
    <Container className="py-4" style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Habits</h2>
          <p className="text-muted">Manage and track your daily habits easily</p>
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
            habits={habits || []}
          />
        )}
      </div>

      <ToastContainer position="top-end" className="pt-5" style={{ zIndex: 99999, position: "fixed" }}>
        {error && (
          <Toast
            onClose={() => setError(null)}
            show={!!error}
            delay={3000}
            autohide
            bg="danger"
            className="text-white shadow"
          >
            <Toast.Header closeButton={false}>
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>{error}</Toast.Body>
          </Toast>
        )}
        {success && (
          <Toast
            onClose={() => setSuccess(null)}
            show={!!success}
            delay={3000}
            autohide
            bg="success"
            className="text-white shadow"
          >
            <Toast.Header closeButton={false}>
              <strong className="me-auto">Success</strong>
            </Toast.Header>
            <Toast.Body>{success}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      {!user ? (
        <Card className="p-4 text-center bg-light border-0 shadow-sm">
          <h5 className="text-warning">⚠ Please log in to use this feature</h5>
        </Card>
      ) : (
        <Row>
          <Col xs={12} md={3} className="mb-4">
            <Card className="p-3 shadow-sm border-0">
              <h5 className="fw-semibold text-primary mb-3">Filters</h5>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Type</Form.Label>
                <Form.Select
                  name="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="">All</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Status</Form.Label>
                <Form.Check
                  type="radio"
                  label="All"
                  name="isActive"
                  value=""
                  checked={statusFilter === ''}
                  onChange={() => setStatusFilter('')}
                />
                <Form.Check
                  type="radio"
                  label="Active"
                  name="isActive"
                  value="true"
                  checked={statusFilter === 'true'}
                  onChange={() => setStatusFilter('true')}
                />
                <Form.Check
                  type="radio"
                  label="Inactive"
                  name="isActive"
                  value="false"
                  checked={statusFilter === 'false'}
                  onChange={() => setStatusFilter('false')}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-medium">Priority</Form.Label>
                {['high', 'medium', 'low'].map(p => (
                  <Form.Check
                    key={p}
                    type="checkbox"
                    label={p.charAt(0).toUpperCase() + p.slice(1)}
                    value={p}
                    checked={priorityFilter.includes(p)}
                    onChange={() => togglePriority(p)}
                  />
                ))}
              </Form.Group>
            </Card>
          </Col>

          <Col xs={12} md={9}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button variant="outline-primary" onClick={MySort}>
                Sort by Type, Priority & Name {sortOrder === 'asc' ? '↑' : ''}
              </Button>
            </div>

            {loading && (!filteredHabits || filteredHabits.length === 0) ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <Row xs={1} md={2} className="g-4">
                {filteredHabits.map((habit) => (
                  <Col key={habit.id}>
                    <Card className="shadow-sm border-0 h-100 habit-card">
                      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                        <h6 className="fw-semibold mb-0 text-primary">{habit.name}</h6>
                        <div>
                          <Edit
                            habit={habit}
                            setHabits={setHabits}
                            setFilteredHabits={setFilteredHabits}
                            setSuccess={setSuccess}
                            setError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            habits={habits || []}
                          />
                          <Button
                            variant="outline-danger"
                            onClick={() => handleDelete(habit.id)}
                            disabled={loading}
                            size="sm"
                            className="ms-2"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-2 text-muted">{habit.description || 'No description provided'}</p>
                        <p className="mb-1"><strong>Type:</strong> {habit.type.charAt(0).toUpperCase() + habit.type.slice(1)}</p>
                        <p className="mb-1">{formatFrequency(habit)}</p>
                        <p className="mb-1">
                          <strong>Priority:</strong>{' '}
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
                        </p>
                        <p>
                          <strong>Status:</strong>{' '}
                          <Form.Check
                            type="switch"
                            checked={habit.isActive}
                            onChange={() => handleToggleActive(habit.id, habit.isActive, habit)}
                            inline
                          />
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      )}

      <style jsx>{`
        .habit-card {
          transition: all 0.2s ease;
        }
        .habit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
      `}</style>
    </Container>
  );
};

export default Habit;