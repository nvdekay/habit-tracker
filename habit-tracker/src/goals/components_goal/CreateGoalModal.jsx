// CreateGoalModal.jsx
import React, { useMemo } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Target, Calendar, Flag, Type, Hash } from "lucide-react";
import { calculateHabitTarget } from "../../services/goalService";

export const CreateGoalModal = ({
  show,
  onClose,
  newGoal,
  setNewGoal,
  error,
  setError,
  habits,
  onSubmit,
  handleCheckLinkedHabit,
}) => {
  // Lọc habit để hiển thị dựa vào startDate của goal
  const filteredHabits = useMemo(() => {
    if (!newGoal.startDate) return habits || [];
    return habits.filter(
      (habit) =>
        new Date(newGoal.startDate) >= new Date(habit.startDate) &&
        new Date(newGoal.startDate) <= new Date(habit.endDate)
    );
  }, [habits, newGoal.startDate]);

  // Tính tổng target dựa vào tất cả habit đã chọn (luôn dùng habits, không dùng filteredHabits)
  const totalTarget = useMemo(() => {
    if (!newGoal.linkedHabits || newGoal.linkedHabits.length === 0) return 0;

    return newGoal.linkedHabits.reduce((sum, habitId) => {
      const habit = habits.find((h) => h.id === habitId);
      if (habit && newGoal.startDate && newGoal.deadline) {
        return (
          sum + calculateHabitTarget(habit, newGoal.startDate, newGoal.deadline)
        );
      }
      return sum;
    }, 0);
  }, [newGoal.linkedHabits, habits, newGoal.startDate, newGoal.deadline]);

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      size="lg"
      className="create-goal-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2 text-primary">
          <Target size={24} />
          Create New Goal
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        <form>
          {/* Goal Title + Priority Row */}
          <Row className="mb-4">
            <Col md={8}>
              <div className="mb-3">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Type size={16} />
                  Goal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Run 100km This Month"
                  className={`form-control form-control-lg ${error.name ? "is-invalid" : ""
                    }`}
                  value={newGoal.name || ""}
                  onChange={(e) => {
                    setNewGoal({ ...newGoal, name: e.target.value });
                    if (e.target.value && e.target.value.trim() !== "") {
                      setError((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                />
                {error.name && (
                  <div className="invalid-feedback">{error.name}</div>
                )}
              </div>
            </Col>

            <Col md={4}>
              <div className="mb-3">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Flag size={16} />
                  Priority
                </label>
                <Form.Select
                  size="lg"
                  value={newGoal.priority || "medium"}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, priority: e.target.value })
                  }
                >
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </Form.Select>
              </div>
            </Col>
          </Row>

          {/* Description */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className={`form-control ${error.description ? "is-invalid" : ""}`}
              placeholder="Describe your goal in detail..."
              rows="3"
              value={newGoal.description || ""}
              onChange={(e) => {
                setNewGoal({ ...newGoal, description: e.target.value });
                if (e.target.value && e.target.value.trim() !== "") {
                  setError((prev) => ({ ...prev, description: "" }));
                }
              }}
            />
            {error.description && (
              <div className="invalid-feedback">{error.description}</div>
            )}
          </div>

          {/* Dates Row */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Calendar size={16} />
                  Start Date
                </label>
                <input
                  type="date"
                  className={`form-control form-control-lg ${error.startDate ? "is-invalid" : ""
                    }`}
                  min={new Date().toISOString().split("T")[0]}
                  value={newGoal.startDate || ""}
                  onChange={(e) => {
                    setNewGoal({ ...newGoal, startDate: e.target.value });
                    if (e.target.value) {
                      setError((prev) => ({ ...prev, startDate: "" }));
                    }
                  }}
                />
                {error.startDate && (
                  <div className="invalid-feedback">{error.startDate}</div>
                )}
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-3">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Calendar size={16} />
                  Deadline
                </label>
                <input
                  type="date"
                  className={`form-control form-control-lg ${error.deadline ? "is-invalid" : ""
                    }`}
                  min={newGoal.startDate}
                  disabled={!newGoal.startDate}
                  value={newGoal.deadline || ""}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, deadline: e.target.value })
                  }
                />
                {error.deadline && (
                  <div className="invalid-feedback">{error.deadline}</div>
                )}
              </div>
            </Col>
          </Row>

          {/* Goal Type Selection */}
          <div className="mb-4">
            <label className="form-label fw-semibold mb-3">Goal Type</label>
            <div className="d-flex gap-4">
              <div className="form-check form-check-lg">
                <input
                  className="form-check-input"
                  type="radio"
                  name="goalType"
                  id="manual-goal"
                  checked={newGoal.type === "manual"}
                  onChange={() =>
                    setNewGoal({ ...newGoal, type: "manual", linkedHabits: [] })
                  }
                />
                <label className="form-check-label fw-semibold" htmlFor="manual-goal">
                  <Badge bg="primary" className="me-2">Manual</Badge>
                  Set target manually
                </label>
              </div>
              <div className="form-check form-check-lg">
                <input
                  className="form-check-input"
                  type="radio"
                  name="goalType"
                  id="auto-goal"
                  checked={newGoal.type === "auto"}
                  onChange={() => {
                    setNewGoal({
                      ...newGoal,
                      type: "auto",
                      unit: "",
                      targetValue: 0,
                    });
                  }}
                />
                <label className="form-check-label fw-semibold" htmlFor="auto-goal">
                  <Badge bg="success" className="me-2">Auto</Badge>
                  Link to existing habits
                </label>
              </div>
            </div>
          </div>

          {/* Manual Mode Fields */}
          {newGoal.type === "manual" && (
            <div className="border rounded-3 p-4 bg-light mb-4">
              <h6 className="text-primary mb-3">Manual Goal Configuration</h6>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Type size={16} />
                      Unit
                    </label>
                    <input
                      type="text"
                      className={`form-control ${error.unit ? "is-invalid" : ""}`}
                      placeholder="e.g., km, books, days"
                      value={newGoal.unit || ""}
                      onChange={(e) => {
                        setNewGoal({ ...newGoal, unit: e.target.value });
                        if (e.target.value && e.target.value.trim() !== "") {
                          setError((prev) => ({ ...prev, unit: "" }));
                        }
                      }}
                    />
                    {error.unit && (
                      <div className="invalid-feedback">{error.unit}</div>
                    )}
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Hash size={16} />
                      Target Value
                    </label>
                    <input
                      type="number"
                      className={`form-control ${error.targetValue ? "is-invalid" : ""}`}
                      min={1}
                      value={newGoal.targetValue || ""}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, targetValue: e.target.value })
                      }
                    />
                    {error.targetValue && (
                      <div className="invalid-feedback">{error.targetValue}</div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Auto Mode Fields */}
          {newGoal.type === "auto" && (
            <div className="border rounded-3 p-4 bg-light mb-4">
              <h6 className="text-success mb-3">Link Existing Habits</h6>

              {filteredHabits.length > 0 ? (
                <div className="mb-3">
                  {filteredHabits.map((habit) => (
                    <div className="form-check mb-3 p-3 border rounded-2 bg-white" key={habit.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={habit.id}
                        id={`habit-${habit.id}`}
                        checked={newGoal.linkedHabits.includes(habit.id)}
                        onChange={handleCheckLinkedHabit}
                      />
                      <label
                        className="form-check-label w-100"
                        htmlFor={`habit-${habit.id}`}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold">{habit.name}</span>
                          <small className="text-muted">
                            {new Date(habit.startDate).toLocaleDateString()} - {new Date(habit.endDate).toLocaleDateString()}
                          </small>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No habits available for the selected start date</p>
                </div>
              )}

              {newGoal.linkedHabits.length > 0 && (
                <div className="alert alert-info">
                  <div className="d-flex align-items-center gap-2">
                    <Target size={20} />
                    <strong>Total Target Value: {totalTarget}</strong>
                  </div>
                </div>
              )}

              {error.linkedHabits && (
                <div className="alert alert-danger">
                  {error.linkedHabits}
                </div>
              )}
            </div>
          )}
        </form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" onClick={onSubmit} className="px-4">
          Create Goal
        </Button>
      </Modal.Footer>
    </Modal>
  );
};