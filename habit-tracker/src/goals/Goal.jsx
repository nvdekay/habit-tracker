import React, { use, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Check } from "lucide-react";
import { Trash } from "lucide-react";
import { Undo2 } from "lucide-react";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Modal,
  ProgressBar,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import "../index.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createGoal, deleteGoal, getHabits, updateGoal } from "../services/goalService";

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
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const handleEditShow = (goal) => {
    setEditGoal(goal);
    setShowEdit(true);
  };

  const handleEditClose = () => {
    setShowEdit(false);
    setEditGoal(null);
  };

  const [startDate, setStartDate] = useState();
  const [newGoal, setNewGoal] = useState({
    userId: user ? user.id : null,
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    priority: "medium",
    status: "in_progress",
    targetValue: 1,
    currentValue: 0,
    unit: "",
    linkedHabits: [],
  });
  const [error, setError] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    linkedHabits: "",
    unit: "",
  });

  //FETCH DATA
  const fetchGoals = async () => {
    const data = await getGoalsByUserID(user.id);
    setGoals(data);
    console.log(data);
  };
  const fetchHabits = async () => {
    const data = await getHabits(user.id);
    setHabits(data);
  };

  //USE EFFECT: Get DATA
  useEffect(() => {
    if (!user) {
      setGoals([]);
      nav("/");
    } else {
      fetchGoals();
      fetchHabits();
    }
  }, []);

  //Filter - Sort
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

  const handleMark = async (goalId) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      let updatedValue = goal.currentValue + 1;

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

  const handleReverse = async (goalId) => {
    if (window.confirm("Are you sure you want to reverse the mark action?")) {
      try {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;

        let updatedValue = goal.currentValue - 1;

        if (updatedValue < 0) {
          updatedValue = 0;
        }

        const updatedGoal = {
          ...goal,
          currentValue: updatedValue,
          status:
            updatedValue >= goal.targetValue ? "completed" : "in_progress",
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    // Validate input (giữ lại trong component vì liên quan đến state UI)
    if (newGoal.name.trim() === "") {
      setError((prev) => ({ ...prev, name: "Goal name is required" }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, name: "" }));
    }

    if (newGoal.startDate === "") {
      setError((prev) => ({ ...prev, startDate: "Start date is required" }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, startDate: "" }));
    }

    if (newGoal.deadline === "") {
      setError((prev) => ({ ...prev, deadline: "Deadline is required" }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, deadline: "" }));
    }

    if (newGoal.linkedHabits.length === 0) {
      setError((prev) => ({
        ...prev,
        linkedHabits: "At least one habit must be linked",
      }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, linkedHabits: "" }));
    }

    if (newGoal.description.trim() === "") {
      setError((prev) => ({ ...prev, description: "Description is required" }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, description: "" }));
    }

    if (newGoal.targetValue <= 0) {
      setError((prev) => ({
        ...prev,
        targetValue: "Target value must be greater than 0",
      }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, targetValue: "" }));
    }

    if (newGoal.unit.trim() === "") {
      setError((prev) => ({ ...prev, unit: "Unit is required" }));
      valid = false;
    } else {
      setError((prev) => ({ ...prev, unit: "" }));
    }

    // Nếu fail validation thì dừng lại
    if (!valid) return;

    // Nếu ok thì gọi API từ service
    try {
      const data = await createGoal(newGoal);

      alert("Thêm mục tiêu thành công!");
      handleClose();
      fetchGoals();
      fetchHabits();
      setGoals(pre => [...pre, newGoal])

      setNewGoal({
        userId: user ? user.id : null,
        name: "",
        description: "",
        startDate: "",
        deadline: "",
        priority: "medium",
        status: "in_progress",
        targetValue: 0,
        currentValue: 0,
        unit: "",
        linkedHabits: [],
      });
    } catch (error) {
      alert("Thêm mục tiêu thất bại!");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editGoal) return;

    try {
      const res = await updateGoal(editGoal); // gọi service
      if (res.status === 200) {
        alert("Cập nhật mục tiêu thành công!");
        fetchGoals(); // reload lại danh sách
        handleEditClose();
      } else {
        alert("Cập nhật thất bại!");
      }
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  const handleCheckLinkedHabit = (e) => {
    const habitId = e.target.value;
    if (e.target.checked) {
      setNewGoal({
        ...newGoal,
        linkedHabits: [...newGoal.linkedHabits, habitId],
      });
      console.log("Create " + [...newGoal.linkedHabits, habitId]);
    } else {
      setNewGoal({
        ...newGoal,
        linkedHabits: newGoal.linkedHabits.filter((id) => id !== habitId),
      });
      console.log(
        "Delete " + newGoal.linkedHabits.filter((id) => id !== habitId)
      );
    }
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

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Goals</h2>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <div className="p-3">
          <div className="d-flex gap-4">
            {/* Status */}

            <div className="space-y-2 flex-fill">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All Status</option>
                <option value="in_progress">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </Form.Select>
            </div>

            {/* Priority */}
            <div className="space-y-2 flex-fill">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </Form.Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2 flex-fill">
              <Form.Label>Sort By</Form.Label>
              <Form.Select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
              >
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
                <option value="created">Created Date</option>
                <option value="priority">Priority</option>
              </Form.Select>
            </div>

            {/* Order */}
            <div className="space-y-2 flex-fill">
              <Form.Label>Order</Form.Label>
              <Form.Select
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters({ ...filters, sortOrder: e.target.value })
                }
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Goals List */}
      <div className="container row g-4 mb-4">
        {goals?.map((goal) => (
          <div key={goal.id} className="col-6">
            <Card key={goal.id} className="shadow-sm h-100 my-4">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <CardTitle className="text-lg ">{goal.name}</CardTitle>
                <div>
                  <span
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Cannot edit a goal that is in progress or completed"
                  >
                    <button
                      className={`btn btn-warning mx-1`}
                      disabled={goal.currentValue !== 0}
                      title={
                        goal.currentValue == 0 ? "Edit GOAL" : "Cannot edit"
                      }
                      onClick={() => handleEditShow(goal)}
                    >
                      <Settings />
                    </button>
                  </span>
                  <button
                    className={`btn btn-danger`}
                    title="Delete GOAL"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash />
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                <p>{goal.description}</p>
                <p className="mt-2">
                  <strong>Deadline:</strong>{" "}
                  {new Date(goal.deadline).toLocaleDateString()}
                </p>
                <p>
                  <strong>Priority:</strong>{" "}
                  {goal.priority == "high" ? "HIGH" : "MEDIUM"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {goal.status == "completed" ? "COMPLETED" : "IN PROGRESSS"}
                </p>
                <p>
                  <strong>Progress:</strong>
                </p>
                <div>
                  <ProgressBar
                    now={((goal.currentValue / goal.targetValue) * 100).toFixed(
                      2
                    )}
                    label={
                      ((goal.currentValue / goal.targetValue) * 100).toFixed(
                        2
                      ) == 100
                        ? "DONE"
                        : `${(
                            (goal.currentValue / goal.targetValue) *
                            100
                          ).toFixed(2)}%`
                    }
                    animated
                    variant={
                      ((goal.currentValue / goal.targetValue) * 100).toFixed(
                        2
                      ) < 50
                        ? "danger"
                        : (
                            (goal.currentValue / goal.targetValue) *
                            100
                          ).toFixed(2) < 80
                        ? "warning"
                        : (
                            (goal.currentValue / goal.targetValue) *
                            100
                          ).toFixed(2) < 100
                        ? "success"
                        : "primary"
                    }
                  />
                  <div>
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <>
                  <CardTitle className="flex items-center text-lg">
                    Linked Habit
                  </CardTitle>
                  <ul>
                    {goal.linkedHabits?.map((habit, i) => (
                      <li key={i}>{habits.find((h) => h.id == habit)?.name}</li>
                    ))}
                  </ul>
                </>
                {goal.status === "in_progress" && (
                  <button
                    className="btn btn-success mx-3"
                    onClick={(e) => handleMark(goal.id)}
                  >
                    <Check /> Mark as done 1 {goal.unit}
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={(e) => handleReverse(goal.id)}
                >
                  <Undo2 /> Return action done 1 {goal.unit}
                </button>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary rounded-circle"
        style={{
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          fontSize: "30px",
          margin: "15px",
          textAlign: "center",
          position: "fixed",
        }}
        onClick={() => handleShow()}
      >
        +
      </button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Create Goal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div className="d-flex gap-3">
              <div className="flex-3">
                <label className="d-block mb-2">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g., Run 100km This Month"
                  className={`form-control mb-3 ${
                    error.name ? "is-invalid" : ""
                  }`}
                  onChange={(e) => {
                    setNewGoal({ ...newGoal, name: e.target.value });
                    if (e.target.value && e.target.value.trim() !== "") {
                      setError((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                />
                {error.name && (
                  <p className="text-red-500 text-sm mb-2">{error.name}</p>
                )}
              </div>
              <div className="flex-fill">
                <label className="d-block mb-2">Priority</label>
                <Form.Select
                  value={newGoal.priority}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, priority: e.target.value })
                  }
                >
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </div>
            </div>

            <label className="d-block mb-2">Description</label>
            <textarea
              className={`form-control ${
                error.description ? "is-invalid" : ""
              }`}
              placeholder="Describe your goal in detail..."
              rows="3"
              onChange={(e) => {
                setNewGoal({ ...newGoal, description: e.target.value });
                if (e.target.value && e.target.value.trim() !== "") {
                  setError((prev) => ({ ...prev, description: "" }));
                }
              }}
            ></textarea>
            {error.description && (
              <p className="text-red-500 text-sm mb-2">{error.description}</p>
            )}

            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Start date</label>
                <input
                  type="date"
                  className={`form-control mb-3 ${
                    error.startDate ? "is-invalid" : ""
                  }`}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setNewGoal({ ...newGoal, startDate: e.target.value });
                    if (e.target.value) {
                      setError((prev) => ({ ...prev, startDate: "" }));
                    }
                  }}
                />
                {error.startDate && (
                  <p className="text-red-500 text-sm mb-2">{error.startDate}</p>
                )}
              </div>

              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Deadline</label>
                <input
                  type="date"
                  className="form-control mb-3"
                  min={newGoal.startDate}
                  disabled={!newGoal.startDate}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, deadline: e.target.value })
                  }
                />
                {error.deadline && (
                  <p className="text-red-500 text-sm mb-2">{error.deadline}</p>
                )}
              </div>
            </div>

            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Unit</label>
                <input
                  type="text"
                  className={`form-control mb-3 ${
                    error.unit ? "is-invalid" : ""
                  }`}
                  placeholder="e.g., km, books, days"
                  onChange={(e) => {
                    setNewGoal({ ...newGoal, unit: e.target.value });
                    if (e.target.value && e.target.value.trim() !== "") {
                      setError((prev) => ({ ...prev, unit: "" }));
                    }
                  }}
                />
                {error.unit && (
                  <p className="text-red-500 text-sm mb-2">{error.unit}</p>
                )}
              </div>
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Target Value</label>
                <input
                  type="number"
                  className={`form-control mb-3}`}
                  min={1}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, targetValue: e.target.value })
                  }
                  pattern="^[2-9]\d*$"
                  oninvalid="this.setCustomValidity('Number must be bigger than 1')"
                />
                {error.targetValue && (
                  <p className="text-red-500 text-sm mb-2">
                    {error.targetValue}
                  </p>
                )}
              </div>
            </div>

            <label className="d-block mb-2">Link Habit</label>
            {habits?.map((habit) => (
              <div className="form-check" key={habit.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={habit.id}
                  id={`habit-${habit.id}`}
                  checked={newGoal.linkedHabits?.includes(habit.id)}
                  onChange={(e) => {
                    handleCheckLinkedHabit(e);
                    console.log(typeof habit.id);
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor={`habit-${habit.id}`}
                >
                  {habit.name}
                </label>
              </div>
            ))}
            {error.linkedHabits && (
              <p className="text-red-500 text-sm mb-2">{error.linkedHabits}</p>
            )}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmit(e)}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showEdit}
        onHide={handleEditClose}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Goal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editGoal && (
            <form>
              <div className="mb-3">
                <label className="form-label">Goal Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={editGoal.name}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editGoal.description}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="d-flex gap-2">
                <div className="flex-fill">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editGoal.startDate?.split("T")[0]}
                    onChange={(e) =>
                      setEditGoal({ ...editGoal, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex-fill">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editGoal.deadline?.split("T")[0]}
                    onChange={(e) =>
                      setEditGoal({ ...editGoal, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mb-3 mt-3">
                <label className="form-label">Priority</label>
                <Form.Select
                  value={editGoal.priority}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, priority: e.target.value })
                  }
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </Form.Select>
              </div>

              <label className="d-block mb-2">Link Habit</label>
              {habits?.map((habit) => (
                <div className="form-check" key={habit.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={habit.id}
                    id={`habit-${habit.id}`}
                    checked={editGoal.linkedHabits?.includes(habit.id)}
                    onChange={(e) => {
                      handleCheckLinkedHabitUpdate(e);
                      console.log(typeof habit.id);
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`habit-${habit.id}`}
                  >
                    {habit.name}
                  </label>
                </div>
              ))}
            </form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
