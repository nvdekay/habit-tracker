import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHabits, updateHabit, deleteHabit } from '../services/habitService';
import {
  Button,
  Form,
  Card,
  Badge,
  Spinner,
  Toast,
  ToastContainer,
  Col,
  Row,
  Container,
  ButtonGroup,
} from 'react-bootstrap';
import {
  Trash2,
  Filter,
  ListChecks,
  PlusCircle,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Search,
  SortAsc,
  Activity
} from 'lucide-react';
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

  // ======= Giữ nguyên logic functions =======
  const transformHabitData = (supabaseData) => {
    if (!supabaseData) return [];
    return supabaseData.map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      type: habit.type,
      frequency: habit.frequency,
      startDate: habit.start_date,
      endDate: habit.end_date,
      priority: habit.priority,
      isActive: habit.is_active,
      isInGoals: habit.is_in_goals,
      userId: habit.user_id,
      createdAt: habit.created_at,
      updatedAt: habit.updated_at,
    }));
  };

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
        setError(null);
        const response = await getHabits(user.id);
        if (response.success) {
          const transformedHabits = transformHabitData(response.data);
          setHabits(transformedHabits);
          setFilteredHabits(transformedHabits);
        } else {
          throw new Error(response.message || 'Failed to fetch habits');
        }
      } catch (error) {
        setError(error.message || 'Failed to fetch habits');
        setHabits([]);
        setFilteredHabits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, [user]);

  useEffect(() => {
    let result = habits;
    if (searchTerm.length > 0) {
      result = result.filter((habit) =>
        habit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter) {
      result = result.filter((habit) => habit.type === typeFilter);
    }
    if (statusFilter === 'true') {
      result = result.filter((habit) => habit.isActive === true);
    } else if (statusFilter === 'false') {
      result = result.filter((habit) => habit.isActive === false);
    }
    if (priorityFilter.length > 0) {
      result = result.filter((habit) => priorityFilter.includes(habit.priority));
    }
    setFilteredHabits(result);
  }, [habits, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        setLoading(true);
        const response = await deleteHabit(id);
        if (response.success) {
          setHabits((prev) => prev.filter((h) => h.id !== id));
          setFilteredHabits((prev) => prev.filter((h) => h.id !== id));
          setSuccess('Habit deleted successfully');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(response.message || 'Failed to delete habit');
        }
      } catch (error) {
        setError(error.message || 'Failed to delete habit');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus, habit) => {
    try {
      setLoading(true);
      const response = await updateHabit(id, {
        ...habit,
        isActive: !currentStatus,
      });
      if (response.success) {
        const updatedHabit = transformHabitData([response.data])[0];
        setHabits((prev) => prev.map((h) => (h.id === id ? updatedHabit : h)));
        setFilteredHabits((prev) =>
          prev.map((h) => (h.id === id ? updatedHabit : h))
        );
        setSuccess(`Habit status changed to ${!currentStatus ? 'Active' : 'Inactive'}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to update habit status');
      }
    } catch (error) {
      setError(error.message || 'Failed to update habit status');
    } finally {
      setLoading(false);
    }
  };

  const togglePriority = (priority) => {
    setPriorityFilter((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
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
      return (
        <div className="d-flex align-items-center gap-1 text-muted small">
          <Clock size={14} />
          <span>{habit.frequency.startTime} - {habit.frequency.endTime}</span>
        </div>
      );
    } else if (habit.type === 'weekly') {
      const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return (
        <div className="text-muted small">
          {habit.frequency.map((f, i) => (
            <div key={i} className="d-flex align-items-center gap-1 mb-1">
              <Calendar size={14} />
              <span>{weekdayNames[f.weekday - 1]} ({f.startTime} - {f.endTime})</span>
            </div>
          ))}
        </div>
      );
    } else if (habit.type === 'monthly') {
      return (
        <div className="text-muted small">
          {habit.frequency.map((f, i) => (
            <div key={i} className="d-flex align-items-center gap-1 mb-1">
              <Calendar size={14} />
              <span>Day {f.day} ({f.startTime} - {f.endTime})</span>
            </div>
          ))}
        </div>
      );
    }
    return '';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'daily': return <Activity size={16} className="text-info" />;
      case 'weekly': return <Calendar size={16} className="text-warning" />;
      case 'monthly': return <Target size={16} className="text-success" />;
      default: return <ListChecks size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // ======= Modern UI =======
  return (
    <>
      <style jsx>{`
        .gradient-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
        }
        .filter-card {
          border-radius: 15px;
          border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .habit-card {
          border-radius: 15px;
          border: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 15px rgba(0,0,0,0.05);
        }
        .habit-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        .stats-card {
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .search-box {
          border-radius: 50px;
          border: 2px solid #e9ecef;
          transition: border-color 0.3s ease;
        }
        .search-box:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        .filter-btn {
          border-radius: 25px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .priority-chip {
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .type-badge {
          border-radius: 10px;
          padding: 4px 8px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>

      <Container className="py-4">
        {/* Header Section */}
        <div className="mb-5">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div>
                  <h2 className="fw-bold">My Habits</h2>
                  <p className="text-muted">Build better habits, achieve your goals</p>
                </div>
              </div>
            </Col>
            <Col xs="auto">
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
            </Col>
          </Row>

          {/* Stats Row */}
          <Row className='g-4 mb-4'>
            <Col md={3}>
              <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#E3F2FD" }}>
                <TrendingUp size={24} className="mb-2 text-primary" />
                <h4 className="fw-bold mb-0">{habits.length}</h4>
                <small className="text-muted">Total Habits</small>
              </div>
            </Col>

            <Col md={3}>
              <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#E8F5E9" }}>
                <Activity size={24} className="mb-2 text-success" />
                <h4 className="fw-bold mb-0">{habits.filter(h => h.isActive).length}</h4>
                <small className="text-muted">Active</small>
              </div>
            </Col>

            <Col md={3}>
              <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#FFF3E0" }}>
                <Target size={24} className="mb-2 text-warning" />
                <h4 className="fw-bold mb-0">{habits.filter(h => h.priority === 'high').length}</h4>
                <small className="text-muted">High Priority</small>
              </div>
            </Col>

            <Col md={3}>
              <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#F3E5F5" }}>
                <Calendar size={24} className="mb-2 text-purple" />
                <h4 className="fw-bold mb-0">{habits.filter(h => h.type === 'daily').length}</h4>
                <small className="text-muted">Daily Habits</small>
              </div>
            </Col>

          </Row>
        </div>

        {/* Toast Messages */}
        <ToastContainer position="top-end" className="p-3">
          {error && (
            <Toast bg="danger" onClose={() => setError(null)} show delay={3000} autohide>
              <Toast.Header closeButton={false}>
                <strong className="me-auto text-white">Error</strong>
              </Toast.Header>
              <Toast.Body className="text-white">{error}</Toast.Body>
            </Toast>
          )}
          {success && (
            <Toast bg="success" onClose={() => setSuccess(null)} show delay={3000} autohide>
              <Toast.Header closeButton={false}>
                <strong className="me-auto text-white">Success</strong>
              </Toast.Header>
              <Toast.Body className="text-white">{success}</Toast.Body>
            </Toast>
          )}
        </ToastContainer>

        {!user ? (
          <Card className="filter-card p-5 text-center">
            <div className="text-warning mb-3">
              <ListChecks size={48} />
            </div>
            <h5 className="text-warning">Please log in to manage your habits</h5>
            <p className="text-muted">Sign in to start building better habits</p>
          </Card>
        ) : (
          <Row className="g-4">
            {/* Filters Sidebar */}
            <Col lg={3}>
              <Card className="filter-card p-4 sticky-top" style={{ top: '20px' }}>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Filter size={20} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-primary">Filters</h5>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">SEARCH</label>
                  <div className="position-relative">
                    <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <Form.Control
                      type="text"
                      placeholder="Search habits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-box ps-5"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">TYPE</label>
                  <div className="d-flex flex-wrap gap-2">
                    {['', 'daily', 'weekly', 'monthly'].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline-secondary"
                        className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                        onClick={() => setTypeFilter(type)}
                      >
                        {type || 'All'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">STATUS</label>
                  <div className="d-flex flex-wrap gap-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' }
                    ].map((status) => (
                      <Button
                        key={status.value}
                        size="sm"
                        variant="outline-secondary"
                        className={`filter-btn ${statusFilter === status.value ? 'active' : ''}`}
                        onClick={() => setStatusFilter(status.value)}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">PRIORITY</label>
                  <div className="d-flex flex-wrap gap-2">
                    {['high', 'medium', 'low'].map((priority) => (
                      <Button
                        key={priority}
                        size="sm"
                        variant={`outline-${getPriorityColor(priority)}`}
                        className={`filter-btn ${priorityFilter.includes(priority) ? 'active' : ''}`}
                        onClick={() => togglePriority(priority)}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Button */}
                <Button
                  variant="outline-secondary"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={MySort}
                >
                  <SortAsc size={16} />
                  Sort {sortOrder === 'asc' ? '(Applied)' : ''}
                </Button>
              </Card>
            </Col>

            {/* Habits Content */}
            <Col lg={9}>
              {loading && filteredHabits.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="lg" />
                  <p className="text-muted mt-3">Loading your habits...</p>
                </div>
              ) : filteredHabits.length === 0 ? (
                <Card className="filter-card p-5 text-center">
                  <div className="text-muted mb-3">
                    <PlusCircle size={64} />
                  </div>
                  <h4 className="text-muted mb-2">No habits found</h4>
                  <p className="text-muted">
                    {searchTerm || typeFilter || statusFilter || priorityFilter.length > 0
                      ? 'Try adjusting your filters or create a new habit.'
                      : 'Create your first habit to start building better routines!'}
                  </p>
                </Card>
              ) : (
                <Row xs={1} lg={2} className="g-4">
                  {filteredHabits.map((habit) => (
                    <Col key={habit.id}>
                      <Card className="habit-card h-100">
                        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {getTypeIcon(habit.type)}
                              <h6 className="fw-bold mb-0 text-primary">{habit.name}</h6>
                            </div>
                            <div className="d-flex gap-2">
                              <span className="type-badge">
                                {habit.type}
                              </span>
                              <Badge
                                bg={getPriorityColor(habit.priority)}
                                className="priority-chip"
                              >
                                {habit.priority}
                              </Badge>
                            </div>
                          </div>
                          <ButtonGroup size="sm">
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
                            >
                              <Trash2 size={14} />
                            </Button>
                          </ButtonGroup>
                        </Card.Header>

                        <Card.Body className="pt-0">
                          <p className="text-muted mb-3 small">
                            {habit.description || 'No description provided'}
                          </p>

                          <div className="mb-3">
                            {formatFrequency(habit)}
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <Form.Check
                              type="switch"
                              id={`habit-${habit.id}`}
                              label={
                                <span className={habit.isActive ? 'text-success fw-semibold' : 'text-muted'}>
                                  {habit.isActive ? 'Active' : 'Inactive'}
                                </span>
                              }
                              checked={habit.isActive}
                              onChange={() => handleToggleActive(habit.id, habit.isActive, habit)}
                              disabled={loading}
                            />
                          </div>
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
    </>
  );
};

export default Habit;