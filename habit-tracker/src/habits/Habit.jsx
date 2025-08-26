import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHabits, updateHabit, deleteHabit } from '../services/habitService';
import { Button, Form, Card, Badge, Spinner, Alert, Col, Row, Container } from 'react-bootstrap';
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
        const habitData = await getHabits();
        const userHabits = Array.isArray(habitData) ? habitData.filter(habit => habit.userId === user.id) : [];
        setHabits(userHabits);
        setFilteredHabits(userHabits);
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

  return (
    <Container className="py-4">
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
        <Row>
          <Col xs={2}>
            <h4>Filters</h4>
            <Form.Group>
              <Form.Label>Search by Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter habit name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <hr />
            <h4>Type</h4>
            <Form.Group>
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
            {/* <h4>Type</h4>
            <div>
              <input
                type="radio"
                name="type"
                value=""
                checked={typeFilter === ''}
                onChange={() => setTypeFilter('')}
                disabled={loading}
              /> All
            </div>
            <div>
              <input
                type="radio"
                name="type"
                value="daily"
                checked={typeFilter === 'daily'}
                onChange={() => setTypeFilter('daily')}
                disabled={loading}
              /> Daily
            </div>
            <div>
              <input
                type="radio"
                name="type"
                value="weekly"
                checked={typeFilter === 'weekly'}
                onChange={() => setTypeFilter('weekly')}
                disabled={loading}
              /> Weekly
            </div>
            <div>
              <input
                type="radio"
                name="type"
                value="monthly"
                checked={typeFilter === 'monthly'}
                onChange={() => setTypeFilter('monthly')}
                disabled={loading}
              /> Monthly
            </div> */}

            <hr />
            <h4>Status</h4>
            <div>
              <input
                type="radio"
                name="isActive"
                value=""
                checked={statusFilter === ''}
                onChange={() => setStatusFilter('')}
                disabled={loading}
              /> All
            </div>
            <div>
              <input
                type="radio"
                name="isActive"
                value="true"
                checked={statusFilter === 'true'}
                onChange={() => setStatusFilter('true')}
                disabled={loading}
              /> Active
            </div>
            <div>
              <input
                type="radio"
                name="isActive"
                value="false"
                checked={statusFilter === 'false'}
                onChange={() => setStatusFilter('false')}
                disabled={loading}
              /> Inactive
            </div>

            <hr />
            <h4>Priority</h4>
            <div>
              <input
                type="checkbox"
                value="high"
                checked={priorityFilter.includes('high')}
                onChange={() => togglePriority('high')}
                disabled={loading}
              /> High
            </div>
            <div>
              <input
                type="checkbox"
                value="medium"
                checked={priorityFilter.includes('medium')}
                onChange={() => togglePriority('medium')}
                disabled={loading}
              /> Medium
            </div>
            <div>
              <input
                type="checkbox"
                value="low"
                checked={priorityFilter.includes('low')}
                onChange={() => togglePriority('low')}
                disabled={loading}
              /> Low
            </div>
          </Col>

          <Col xs={10}>
            <div className="d-flex justify-content-between align-items-center mb-3">

              <Button
                className="btn btn-primary"
                onClick={MySort}
              >
                Sort by Type, Priority & Name {sortOrder === 'asc' ? '↑' : ''}
              </Button>
            </div>

            {loading && (!filteredHabits || filteredHabits.length === 0) ? (
              <Spinner animation="border" />
            ) : (
              <Row xs={1} md={3} className="g-4">
                {filteredHabits.map((habit) => (
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
                              onClick={() => handleDelete(habit.id)}
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
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Habit;