import React, { use, useEffect, useState } from "react";
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
import axios from "axios";
import {
  calculateHabitTarget,
  createGoal,
  deleteGoal,
  getGoalsByUserID,
  getHabits,
  updateGoal,
} from "../services/goalService";
import { CreateGoalModal } from "./components_goal/CreateGoalModal";
import { EditGoalModal } from "./components_goal/EditGoalModal";
import { FilterSection } from "./components_goal/FilterSection";
import { GoalCard } from "./components_goal/GoalCard";

export default function Goal() {
  const { user } = useAuth();
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
    type: "manual", // "manual" hoặc "auto"
    targetValue: 1, // chỉ cần khi manual
    currentValue: 0, // manual: người dùng điều chỉnh
    unit: "", // chỉ cần khi manual
    linkedHabits: [], // chỉ cần khi auto
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
    setEditGoal(goal);
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
    if (!user) {
      setGoals([]);
      nav("/");
    } else {
      fetchGoals();
      fetchHabits();
    }
  }, []);

  useEffect(() => {
    if (user) {
      let url = `http://localhost:8080/goals?userId=${user.id}`;

      if (filters.status !== "all") {
        url += `&status=${filters.status}`;
      }
      if (filters.priority !== "all") {
        url += `&priority=${filters.priority}`;
      }

      const fetchFilteredGoals = async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Fetch failed");
          let data = await res.json();

          // sort client cho tất cả sortBy
          if (filters.sortBy) {
            data.sort((a, b) => {
              let valueA, valueB;

              switch (filters.sortBy) {
                case "progress":
                  valueA = a.currentValue / a.targetValue;
                  valueB = b.currentValue / b.targetValue;
                  break;
                case "deadline":
                  valueA = new Date(a.deadline);
                  valueB = new Date(b.deadline);
                  break;
                case "createdDate":
                  valueA = new Date(a.createdDate);
                  valueB = new Date(b.createdDate);
                  break;
                case "priority":
                  // nếu priority là string "high"/"medium"/"low" → map sang số cho dễ sort
                  const priorityMap = { high: 3, medium: 2, low: 1 };
                  valueA = priorityMap[a.priority] || 0;
                  valueB = priorityMap[b.priority] || 0;
                  break;
                default:
                  valueA = a[filters.sortBy];
                  valueB = b[filters.sortBy];
              }

              if (valueA instanceof Date && valueB instanceof Date) {
                return filters.sortOrder === "asc"
                  ? valueA - valueB
                  : valueB - valueA;
              } else if (
                typeof valueA === "string" &&
                typeof valueB === "string"
              ) {
                return filters.sortOrder === "asc"
                  ? valueA.localeCompare(valueB)
                  : valueB.localeCompare(valueA);
              } else {
                return filters.sortOrder === "asc"
                  ? valueA - valueB
                  : valueB - valueA;
              }
            });
          }

          setGoals(data);
        } catch (err) {
          console.error(err);
        }
      };

      fetchFilteredGoals();
    }
  }, [filters, user]);

  const handleMark = async (goalId, numberOfUnits = 1) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      let updatedValue = goal.currentValue + numberOfUnits;

      if (updatedValue > goal.targetValue) {
        updatedValue = goal.targetValue;
      }

      const updatedGoal = {
        ...goal,
        currentValue: updatedValue,
        status: updatedValue >= goal.targetValue ? "completed" : goal.status,
      };

      const res = await axios.put(
        `http://localhost:8080/goals/${goalId}`,
        updatedGoal,
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? updatedGoal : g))
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

      let updatedValue = goal.currentValue - numberOfUnits;
      if (updatedValue < 0) updatedValue = 0;

      const updatedGoal = {
        ...goal,
        currentValue: updatedValue,
        status: updatedValue >= goal.targetValue ? "completed" : "in_progress",
      };

      const res = await axios.put(
        `http://localhost:8080/goals/${goalId}`,
        updatedGoal,
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? updatedGoal : g))
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
        `Bạn có chắc muốn reset goal "${goal.name}" về 0? Nhập "YES" để xác nhận.`
      );

      if (confirmInput !== "YES") {
        alert("Reset bị hủy. Bạn cần nhập chính xác YES.");
        return;
      }

      const updatedGoal = {
        ...goal,
        currentValue: 0,
        status: "in_progress", // hoặc giữ nguyên goal.status nếu bạn muốn
      };

      const res = await axios.put(
        `http://localhost:8080/goals/${goalId}`,
        updatedGoal,
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? updatedGoal : g))
        );
        alert("Reset thành công!");
      }
    } catch (err) {
      console.error(err);
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
      newGoal.linkedHabits.forEach(async (habitId) => {
        try {
          await fetch(`http://localhost:8080/habits/${habitId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isInGoals: true }),
          });
          console.log(`Habit ${habitId} updated with isInGoals:true`);
        } catch (error) {
          console.error(`Failed to update habit ${habitId}:`, error);
        }
      });
      alert("Thêm mục tiêu thành công!");
      handleClose();
      setGoals((prev) => [...prev, newGoal]);

      // Reset state to default
      setNewGoal({
        userId: user ? user.id : null,
        name: "",
        description: "",
        startDate: "",
        deadline: "",
        priority: "medium",
        status: "in_progress",
        type: "manual", // mặc định tạo mới là manual
        targetValue: 0,
        currentValue: 0,
        unit: "",
        linkedHabits: [],
      });
    } catch (err) {
      alert("Thêm mục tiêu thất bại!");
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editGoal) return;

    try {
      const res = await updateGoal(editGoal); // gọi service

      if (res.status === 200) {
        alert("Cập nhật mục tiêu thành công!");

        // gọi lại API để đồng bộ state với DB
        const goalsData = await getGoalsByUserID(user.id);
        setGoals(goalsData);

        const habitsData = await getHabits(user.id);
        setHabits(habitsData);

        handleEditClose();
      } else {
        alert("Cập nhật thất bại!");
      }
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  const handleDelete = async (goalID) => {
    if (window.confirm("Sure delete?")) {
      try {
        const res = await deleteGoal(goalID);

        if (res.data) {
          alert("Xoá mục tiêu thành công!");
          setGoals((prev) => prev.filter((goal) => goal.id !== goalID));
        } else {
          alert("Xoá mục tiêu thất bại!");
        }
      } catch (error) {
        alert("Xoá mục tiêu thất bại!");
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

    // Tính total targetValue từ các habit đã chọn
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

    console.log("Total target: " + totalTarget);

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
        linkedHabits: [...editGoal.linkedHabits, habitId],
      });
    } else {
      setEditGoal({
        ...editGoal,
        linkedHabits: editGoal.linkedHabits.filter((id) => id !== habitId),
      });
    }
  };

  // Calculate stats
  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === "completed").length,
    inProgress: goals.filter(g => g.status === "in_progress").length,
    averageProgress: goals.length > 0
      ? (goals.reduce((sum, g) => sum + (g.currentValue / g.targetValue) * 100, 0) / goals.length).toFixed(1)
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
            <div className="bg-primary text-white rounded-3 p-4 text-center">
              <Target size={24} className="mb-2" />
              <h3 className="fw-bold mb-1">{stats.total}</h3>
              <small>Total Goals</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-success text-white rounded-3 p-4 text-center">
              <Award size={24} className="mb-2" />
              <h3 className="fw-bold mb-1">{stats.completed}</h3>
              <small>Completed</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-warning text-white rounded-3 p-4 text-center">
              <TrendingUp size={24} className="mb-2" />
              <h3 className="fw-bold mb-1">{stats.inProgress}</h3>
              <small>In Progress</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-info text-white rounded-3 p-4 text-center">
              <TrendingUp size={24} className="mb-2" />
              <h3 className="fw-bold mb-1">{stats.averageProgress}%</h3>
              <small>Avg Progress</small>
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