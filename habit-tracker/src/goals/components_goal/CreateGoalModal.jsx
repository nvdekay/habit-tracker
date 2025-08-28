// CreateGoalModal.jsx
import React, { useMemo } from "react";
import { Modal, Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
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
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Create Goal</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form>
          {/* Goal Title + Priority */}
          <div className="d-flex gap-3">
            <div className="flex-3">
              <label className="d-block mb-2">Goal Title</label>
              <input
                type="text"
                placeholder="e.g., Run 100km This Month"
                className={`form-control mb-3 ${
                  error.name ? "is-invalid" : ""
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
                <p className="text-red-500 text-sm mb-2">{error.name}</p>
              )}
            </div>
            <div className="flex-fill">
              <label className="d-block mb-2">Priority</label>
              <Form.Select
                value={newGoal.priority || "medium"}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, priority: e.target.value })
                }
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </div>
          </div>

          {/* Description */}
          <label className="d-block mb-2">Description</label>
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
          ></textarea>
          {error.description && (
            <p className="text-red-500 text-sm mb-2">{error.description}</p>
          )}

          {/* Dates */}
          <div className="d-flex gap-2">
            <div className="flex-fill">
              <label className="d-block mb-2 mt-3">Start date</label>
              <input
                type="date"
                className={`form-control mb-3 ${
                  error.startDate ? "is-invalid" : ""
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
                <p className="text-red-500 text-sm mb-2">{error.startDate}</p>
              )}
            </div>

            <div className="flex-fill">
              <label className="d-block mb-2 mt-3">Deadline</label>
              <input
                type="date"
                className={`form-control mb-3 ${
                  error.deadline ? "is-invalid" : ""
                }`}
                min={newGoal.startDate}
                disabled={!newGoal.startDate}
                value={newGoal.deadline || ""}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, deadline: e.target.value })
                }
              />
              {error.deadline && (
                <p className="text-red-500 text-sm mb-2">{error.deadline}</p>
              )}
            </div>
          </div>

          {/* Goal Type */}
          <label className="d-block mb-2 mt-3">Goal Type</label>
          <div className="d-flex gap-3 mb-3">
            <Form.Check
              type="radio"
              id="manual-goal"
              name="goalType"
              label="Manual"
              checked={newGoal.type === "manual"}
              onChange={() =>
                setNewGoal({ ...newGoal, type: "manual", linkedHabits: [] })
              }
            />
            <Form.Check
              type="radio"
              id="auto-goal"
              name="goalType"
              label="Auto (from Habits)"
              checked={newGoal.type === "auto"}
              onChange={() => {
                setNewGoal({
                  ...newGoal,
                  type: "auto",
                  unit: "",
                  targetValue: 0,
                });
                console.log({
                  ...newGoal,
                  type: "auto",
                  unit: "",
                  targetValue: 0,
                });
                
              }}
            />
          </div>

          {/* Manual Mode Fields */}
          {newGoal.type === "manual" && (
            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Unit</label>
                <input
                  type="text"
                  className={`form-control mb-3 ${
                    error.unit ? "is-invalid" : ""
                  }`}
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
                  <p className="text-red-500 text-sm mb-2">{error.unit}</p>
                )}
              </div>
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Target Value</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  min={1}
                  value={newGoal.targetValue || ""}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, targetValue: e.target.value })
                  }
                />
                {error.targetValue && (
                  <p className="text-red-500 text-sm mb-2">
                    {error.targetValue}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Auto Mode Fields */}
          {newGoal.type === "auto" && (
            <>
              <label className="d-block mb-2">Link Habits</label>
              {filteredHabits.map((habit) => (
                <div
                  className="form-check"
                  key={habit.id}
                  style={{ position: "relative" }}
                >
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
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{habit.name}</span>
                    <span
                      className="text-muted fst-italic"
                      style={{ fontSize: "0.85em" }}
                    >
                      {new Date(habit.startDate).toLocaleDateString()} -{" "}
                      {new Date(habit.endDate).toLocaleDateString()}
                    </span>
                  </label>
                </div>
              ))}

              <h3 className="mt-2">
                <strong>Total Target Value:</strong> {totalTarget}
              </h3>

              {error.linkedHabits && (
                <p className="text-red-500 text-sm mb-2">
                  {error.linkedHabits}
                </p>
              )}
            </>
          )}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Lưu
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
