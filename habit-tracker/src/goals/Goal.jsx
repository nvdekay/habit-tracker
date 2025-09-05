import React, { useEffect, useState } from "react";
import { Plus, Target, TrendingUp, Award } from "lucide-react";
import {
  Button,
  Container,
  Row,
  Col,
  Alert,
  Spinner
} from "react-bootstrap";
import "../index.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  calculateHabitTarget,
  createGoal,
  deleteGoal,
  getGoalsByUserID,
  getHabits,
  updateGoal,
  getGoalsWithFilters
} from "../services/goalService";
import { updateHabit } from "../services/habitService";
import { CreateGoalModal } from "./components_goal/CreateGoalModal";
import { EditGoalModal } from "./components_goal/EditGoalModal";
import { FilterSection } from "./components_goal/FilterSection";
import { GoalCard } from "./components_goal/GoalCard";

export default function Goal() {
  const { user, isAuthenticated } = useAuth();
  const nav = useNavigate();

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    sortBy: "deadline",
    sortOrder: "asc",
  });

  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [show, setShow] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const [newGoal, setNewGoal] = useState({
    userId: user ? user.id : null,
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    priority: "medium",
    status: "in_progress",
    type: "manual", // "manual" or "auto"
    targetValue: 1, // only needed for manual
    currentValue: 0, // manual: user adjusts
    unit: "", // only needed for manual
    linkedHabits: [], // only needed for auto
  });

  const [error, setError] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    linkedHabits: "",
    unit: "",
  });

  // Modal handlers
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleEditShow = (goal) => {
    // Handle both field formats when setting edit goal
    const formattedGoal = {
      ...goal,
      startDate: goal.start_date || goal.startDate,
      deadline: goal.deadline,
      targetValue: goal.target_value || goal.targetValue,
      currentValue: goal.current_value || goal.currentValue,
      linkedHabits: goal.linked_habits || goal.linkedHabits || []
    };
    setEditGoal(formattedGoal);
    setShowEdit(true);
  };
  const handleEditClose = () => {
    setShowEdit(false);
    setEditGoal(null);
  };

  // Data fetching
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await getGoalsByUserID(user.id);
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabits = async () => {
    try {
      const data = await getHabits(user.id);
      setHabits(data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  // Effects
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGoals([]);
      nav("/");
    } else {
      fetchGoals();
      fetchHabits();
    }
  }, [isAuthenticated, user, nav]);

  useEffect(() => {
    if (user) {
      const fetchFilteredGoals = async () => {
        try {
          const data = await getGoalsWithFilters(user.id, filters);
          setGoals(data);
        } catch (err) {
          console.error("Error fetching filtered goals:", err);
        }
      };

      fetchFilteredGoals();
    }
  }, [filters, user]);

  const handleMark = async (goalId, numberOfUnits = 1) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const currentVal = goal.current_value || goal.currentValue || 0;
      const targetVal = goal.target_value || goal.targetValue || 1;
      let updatedValue = currentVal + numberOfUnits;

      if (updatedValue > targetVal) {
        updatedValue = targetVal;
      }

      const updatedGoal = {
        ...goal,
        current_value: updatedValue,
        currentValue: updatedValue,
        status: updatedValue >= targetVal ? "completed" : goal.status,
      };

      const res = await updateGoal(updatedGoal);

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, current_value: updatedValue, currentValue: updatedValue, status: updatedGoal.status } : g))
        );
      }
    } catch (err) {
      console.error("Error marking goal:", err);
    }
  };

  const handleReverse = async (goalId, numberOfUnits = 1) => {
    if (!window.confirm("Are you sure you want to reverse the mark action?"))
      return;

    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const currentVal = goal.current_value || goal.currentValue || 0;
      let updatedValue = currentVal - numberOfUnits;
      if (updatedValue < 0) updatedValue = 0;

      const updatedGoal = {
        ...goal,
        current_value: updatedValue,
        currentValue: updatedValue,
        status: updatedValue >= (goal.target_value || goal.targetValue) ? "completed" : "in_progress",
      };

      const res = await updateGoal(updatedGoal);

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, current_value: updatedValue, currentValue: updatedValue, status: updatedGoal.status } : g))
        );
      }
    } catch (err) {
      console.error("Error reversing goal:", err);
    }
  };

  const handleReset = async (goalId) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const confirmInput = window.prompt(
        `Are you sure you want to reset goal "${goal.name}" to 0? Type "YES" to confirm.`
      );

      if (confirmInput !== "YES") {
        alert("Reset cancelled. You need to type exactly YES.");
        return;
      }

      const updatedGoal = {
        ...goal,
        current_value: 0,
        currentValue: 0,
        status: "in_progress",
      };

      const res = await updateGoal(updatedGoal);

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, current_value: 0, currentValue: 0, status: "in_progress" } : g))
        );
        alert("Reset successful!");
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    // Common validations
    if (!newGoal.name.trim()) {
      setError((prev) => ({ ...prev, name: "Goal name is required" }));
      valid = false;
    } else setError((prev) => ({ ...prev, name: "" }));

    if (!newGoal.startDate) {
      setError((prev) => ({ ...prev, startDate: "Start date is required" }));
      valid = false;
    } else setError((prev) => ({ ...prev, startDate: "" }));

    if (!newGoal.deadline) {
      setError((prev) => ({ ...prev, deadline: "Deadline is required" }));
      valid = false;
    } else setError((prev) => ({ ...prev, deadline: "" }));

    if (!newGoal.description.trim()) {
      setError((prev) => ({ ...prev, description: "Description is required" }));
      valid = false;
    } else setError((prev) => ({ ...prev, description: "" }));

    // Mode-specific validations
    if (newGoal.type === "manual") {
      if (!newGoal.unit.trim()) {
        setError((prev) => ({ ...prev, unit: "Unit is required" }));
        valid = false;
      } else setError((prev) => ({ ...prev, unit: "" }));

      if (!newGoal.targetValue || newGoal.targetValue <= 0) {
        setError((prev) => ({
          ...prev,
          targetValue: "Target value must be greater than 0",
        }));
        valid = false;
      } else setError((prev) => ({ ...prev, targetValue: "" }));

      // For manual, linkedHabits should be empty
      setNewGoal((prev) => ({ ...prev, linkedHabits: [] }));
    }

    if (newGoal.type === "auto") {
      if (!newGoal.linkedHabits || newGoal.linkedHabits.length === 0) {
        setError((prev) => ({
          ...prev,
          linkedHabits: "At least one habit must be linked",
        }));
        valid = false;
      } else setError((prev) => ({ ...prev, linkedHabits: "" }));

      // For auto, unit and targetValue should be empty
      setNewGoal((prev) => ({ ...prev, unit: "", targetValue: "" }));
    }

    if (!valid) return;

    try {
      const data = await createGoal(newGoal);

      // Update linked habits with isInGoals flag
      for (const habitId of newGoal.linkedHabits) {
        try {
          const habit = habits.find(h => h.id === habitId);
          if (habit) {
            await updateHabit(habitId, {
              ...habit,
              is_in_goals: true,
              isInGoals: true
            });
          }
          
        } catch (error) {
          console.error(`Failed to update habit ${habitId}:`, error);
        }
      }

      alert("Goal created successfully!");
      handleClose();
      fetchGoals(); // Refetch goals to get the new one

      // Reset state to default
      setNewGoal({
        userId: user ? user.id : null,
        name: "",
        description: "",
        startDate: "",
        deadline: "",
        priority: "medium",
        status: "in_progress",
        type: "manual",
        targetValue: 1,
        currentValue: 0,
        unit: "",
        linkedHabits: [],
      });
    } catch (err) {
      alert("Failed to create goal!");
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editGoal) return;

    try {
      const res = await updateGoal(editGoal);

      if (res.status === 200) {
        alert("Goal updated successfully!");

        // Fetch updated data
        const goalsData = await getGoalsByUserID(user.id);
        setGoals(goalsData);

        const habitsData = await getHabits(user.id);
        setHabits(habitsData);

        handleEditClose();
      } else {
        alert("Update failed!");
      }
    } catch (error) {
      alert("Update failed!");
      console.error("Update error:", error);
    }
  };

  const handleDelete = async (goalID) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        const res = await deleteGoal(goalID);

        if (res.data) {
          alert("Goal deleted successfully!");
          setGoals((prev) => prev.filter((goal) => goal.id !== goalID));
        } else {
          alert("Failed to delete goal!");
        }
      } catch (error) {
        alert("Failed to delete goal!");
        console.error("Delete error:", error);
      }
    }
  };

  const handleCheckLinkedHabit = (e) => {
    const habitId = e.target.value;
    let updatedHabits = [...newGoal.linkedHabits];

    if (e.target.checked) {
      updatedHabits.push(habitId);
    } else {
      updatedHabits = updatedHabits.filter((id) => id !== habitId);
    }

    // Calculate total targetValue from selected habits
    let totalTarget = 0;
    updatedHabits.forEach((id) => {
      const habit = habits.find((h) => h.id === id);
      if (habit && newGoal.startDate && newGoal.deadline) {
        totalTarget += calculateHabitTarget(
          habit,
          newGoal.startDate,
          newGoal.deadline
        );
      }
    });

    

    setNewGoal({
      ...newGoal,
      linkedHabits: updatedHabits,
      targetValue: totalTarget,
    });
  };

  const handleCheckLinkedHabitUpdate = (e) => {
    const habitId = e.target.value;
    if (e.target.checked) {
      setEditGoal({
        ...editGoal,
        linkedHabits: [...(editGoal.linkedHabits || []), habitId],
      });
    } else {
      setEditGoal({
        ...editGoal,
        linkedHabits: (editGoal.linkedHabits || []).filter((id) => id !== habitId),
      });
    }
  };

  // Calculate stats - handle both field formats
  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === "completed").length,
    inProgress: goals.filter(g => g.status === "in_progress").length,
    averageProgress: goals.length > 0
      ? (goals.reduce((sum, g) => {
        const current = g.current_value || g.currentValue || 0;
        const target = g.target_value || g.targetValue || 1;
        return sum + (current / target) * 100;
      }, 0) / goals.length).toFixed(1)
      : 0
  };

  return (
    <Container className="py-4">
      {/* Header Section */}
      <div className="mb-5">
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div>
                <h2 className="fw-bold">My Goals</h2>
                <p className="text-muted">Set and achieve your personal goals</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col md={3}>
            <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#E3F2FD" }}>
              <Target size={28} className="mb-2 text-primary" />
              <h3 className="fw-bold mb-1 text-dark">{stats.total}</h3>
              <small className="text-muted">Total Goals</small>
            </div>
          </Col>

          <Col md={3}>
            <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#E8F5E9" }}>
              <Award size={28} className="mb-2 text-success" />
              <h3 className="fw-bold mb-1 text-dark">{stats.completed}</h3>
              <small className="text-muted">Completed</small>
            </div>
          </Col>

          <Col md={3}>
            <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#FFF9E6" }}>
              <TrendingUp size={28} className="mb-2 text-warning" />
              <h3 className="fw-bold mb-1 text-dark">{stats.inProgress}</h3>
              <small className="text-muted">In Progress</small>
            </div>
          </Col>

          <Col md={3}>
            <div className="rounded-3 p-4 text-center shadow-sm" style={{ backgroundColor: "#F3E5F5" }}>
              <TrendingUp size={28} className="mb-2 text-purple" />
              <h3 className="fw-bold mb-1 text-dark">{stats.averageProgress}%</h3>
              <small className="text-muted">Avg Progress</small>
            </div>
          </Col>
        </Row>
      </div>

      {/* Filter Section */}
      <FilterSection filters={filters} setFilters={setFilters} />

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Loading your goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <Target size={48} className="text-muted mb-3" />
          <h4>No goals found</h4>
          <p className="mb-4">Start your journey by creating your first goal!</p>
          <Button variant="primary" size="lg" onClick={handleShow}>
            <Plus size={20} className="me-2" />
            Create Your First Goal
          </Button>
        </Alert>
      ) : (
        <Row className="g-4 mb-5">
          {goals.map((goal) => (
            <Col key={goal.id} lg={6} xl={4}>
              <GoalCard
                goal={goal}
                habits={habits}
                onEdit={handleEditShow}
                onDelete={handleDelete}
                onMark={handleMark}
                onReverse={handleReverse}
                onReset={handleReset}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Floating Add Button */}
      <Button
        variant="primary"
        className="rounded-circle position-fixed shadow-lg"
        style={{
          bottom: "30px",
          right: "30px",
          width: "65px",
          height: "65px",
          zIndex: 1050,
          border: "3px solid white"
        }}
        onClick={handleShow}
      >
        <Plus size={28} />
      </Button>

      {/* Modals */}
      <CreateGoalModal
        show={show}
        onClose={handleClose}
        newGoal={newGoal}
        setNewGoal={setNewGoal}
        error={error}
        setError={setError}
        habits={habits}
        onSubmit={handleSubmit}
        handleCheckLinkedHabit={handleCheckLinkedHabit}
      />

      <EditGoalModal
        show={showEdit}
        onClose={handleEditClose}
        editGoal={editGoal}
        setEditGoal={setEditGoal}
        error={error}
        setError={setError}
        habits={habits}
        onUpdate={handleUpdate}
        handleCheckLinkedHabitUpdate={handleCheckLinkedHabitUpdate}
      />
    </Container>
  );
}