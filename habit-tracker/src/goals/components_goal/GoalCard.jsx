// GoalCard.jsx - Component cho từng goal card
import React, { useState } from "react";
import {
  Settings,
  Check,
  Trash,
  Undo2,
  ListRestart,
  Calendar,
  Target,
  TrendingUp,
  Link
} from "lucide-react";
import {
  Badge,
  Card,
  Button,
  ProgressBar,
  ButtonGroup
} from "react-bootstrap";

export const GoalCard = ({
  goal,
  habits,
  onEdit,
  onDelete,
  onMark,
  onReverse,
  onReset,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showReverseInput, setShowReverseInput] = useState(false);
  const [reverseValue, setReverseValue] = useState("");

  const handleSubmitMark = () => {
    const numberOfUnits = parseInt(inputValue);
    if (isNaN(numberOfUnits) || numberOfUnits <= 0) {
      alert("Please enter a valid number greater than 0");
      return;
    }
    onMark(goal.id, numberOfUnits);
    setInputValue("");
    setShowInput(false);
  };

  const handleSubmitReverse = () => {
    const numberOfUnits = parseInt(reverseValue);
    if (isNaN(numberOfUnits) || numberOfUnits <= 0) {
      alert("Please enter a valid number greater than 0");
      return;
    }
    onReverse(goal.id, numberOfUnits);
    setReverseValue("");
    setShowReverseInput(false);
  };

  const getProgressVariant = (progress) => {
    if (progress < 50) return "danger";
    if (progress < 80) return "warning";
    if (progress < 100) return "success";
    return "primary";
  };

  const progressPercent = (
    (goal.currentValue / goal.targetValue) *
    100
  ).toFixed(2);

  const getPriorityBadge = () => {
    return goal.priority === "high"
      ? <Badge bg="danger" className="me-2">High Priority</Badge>
      : <Badge bg="secondary" className="me-2">Medium Priority</Badge>;
  };

  const getStatusBadge = () => {
    return goal.status === "completed"
      ? <Badge bg="success" className="me-2">Completed</Badge>
      : <Badge bg="primary" className="me-2">In Progress</Badge>;
  };

  const getModeBadge = () => {
    return goal.mode === "auto"
      ? <Badge bg="info" className="me-2">Auto</Badge>
      : <Badge bg="warning" className="me-2">Manual</Badge>;
  };

  return (
    <Card 
      className="shadow-sm border rounded-3 h-100 goal-card"
      style={{ transition: "all 0.2s ease-in-out" }}
    >
      {/* Header */}
      <Card.Header className="bg-light border-bottom d-flex justify-content-between align-items-start p-4 rounded-top-3">
        <div className="flex-grow-1">
          <Card.Title className="h5 mb-2 text-dark fw-bold">
            {goal.name}
          </Card.Title>
          <div className="d-flex flex-wrap gap-1 mb-2">
            {getPriorityBadge()}
            {getStatusBadge()}
            {getModeBadge()}
          </div>
        </div>

        {/* Action Buttons */}
        <ButtonGroup size="sm">
          <Button
            variant="outline-warning"
            disabled={goal.currentValue !== 0}
            title={goal.currentValue === 0 ? "Edit Goal" : "Cannot edit goal in progress"}
            onClick={() => onEdit(goal)}
            className="border-2"
          >
            <Settings size={16} />
          </Button>
          <Button
            variant="outline-danger"
            title="Delete Goal"
            onClick={() => onDelete(goal.id)}
            className="border-2"
          >
            <Trash size={16} />
          </Button>
        </ButtonGroup>
      </Card.Header>

      {/* Body */}
      <Card.Body className="p-4">
        {/* Description */}
        <p className="text-muted mb-3 small">{goal.description}</p>

        {/* Deadline */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <Calendar size={16} className="text-info" />
          <span className="fw-semibold">Deadline:</span>
          <span className="text-muted">
            {new Date(goal.deadline).toLocaleDateString()}
          </span>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <TrendingUp size={16} className="text-success" />
              <span className="fw-semibold">Progress</span>
            </div>
            <span className="fw-bold text-primary">
              {progressPercent}%
            </span>
          </div>

          <ProgressBar
            now={progressPercent}
            variant={getProgressVariant(parseFloat(progressPercent))}
            className="mb-2"
            style={{ height: "10px" }}
            striped
            animated={goal.status === "in_progress"}
          />

          <div className="d-flex justify-content-between small text-muted">
            <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
            <span>
              {progressPercent >= 100 ? "COMPLETED!" : `${goal.targetValue - goal.currentValue} remaining`}
            </span>
          </div>
        </div>
      </Card.Body>

      {/* Footer */}
      <Card.Footer className="bg-white border-top p-4 rounded-bottom-3">
        {/* Linked Habits or Actions */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            {goal.type === "auto" ? (
              <>
                <Link size={16} className="text-success" />
                <span className="fw-semibold text-success">Linked Habits</span>
              </>
            ) : (
              <>
                <Target size={16} className="text-primary" />
                <span className="fw-semibold text-primary">Actions</span>
              </>
            )}
          </div>

          {goal.linkedHabits?.length > 0 && (
            <div className="ps-3">
              {goal.linkedHabits.map((habitId, i) => {
                const habit = habits.find((h) => h.id === habitId);
                return habit ? (
                  <div key={i} className="small text-muted mb-1">
                    • {habit.name}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Manual Goal Actions */}
        {goal.type !== "auto" && (
          <div className="d-grid gap-2">
            {/* Mark as Done Section */}
            {goal.status === "in_progress" && (
              <div>
                {!showInput ? (
                  <Button
                    variant="success"
                    onClick={() => setShowInput(true)}
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Check size={16} />
                    Mark Progress
                  </Button>
                ) : (
                  <div className="d-flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={goal.targetValue - goal.currentValue}
                      className="form-control"
                      placeholder={`Max: ${goal.targetValue - goal.currentValue}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSubmitMark}
                      size="sm"
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setShowInput(false);
                        setInputValue("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Reverse Action Section */}
            <div>
              {!showReverseInput ? (
                <Button
                  variant="outline-danger"
                  onClick={() => setShowReverseInput(true)}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  size="sm"
                >
                  <Undo2 size={16} />
                  Reverse Progress
                </Button>
              ) : (
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={goal.currentValue}
                    className="form-control form-control-sm"
                    placeholder={`Max: ${goal.currentValue}`}
                    value={reverseValue}
                    onChange={(e) => setReverseValue(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSubmitReverse}
                    size="sm"
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setShowReverseInput(false);
                      setReverseValue("");
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Reset Progress */}
            {(goal.status === "in_progress" || goal.status === "completed") && (
              <Button
                variant="outline-warning"
                onClick={() => onReset(goal.id)}
                className="d-flex align-items-center justify-content-center gap-2"
                size="sm"
              >
                <ListRestart size={16} />
                Reset Progress
              </Button>
            )}
          </div>
        )}
      </Card.Footer>
    </Card>
  );
};
