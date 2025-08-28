// FilterSection.jsx - Component cho phần lọc và sắp xếp
import React from 'react';
import { Card, Row, Col } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { Filter, ArrowUpDown, CheckCircle, Flag } from "lucide-react";

export const FilterSection = ({ filters, setFilters }) => {
  return (
    <Card className="mb-4 shadow-sm border-0">
      <Card.Header className="bg-light border-0 py-3">
        <div className="d-flex align-items-center gap-2">
          <Filter size={20} className="text-primary" />
          <Card.Title className="mb-0 text-primary fw-semibold">
            Filters & Sorting
          </Card.Title>
        </div>
      </Card.Header>
      
      <Card.Body className="p-4">
        <Row className="g-4">
          {/* Status Filter */}
          <Col lg={3} md={6}>
            <div className="filter-group">
              <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                Status
              </Form.Label>
              <Form.Select
                size="lg"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="border-2"
              >
                <option value="all">All Status</option>
                <option value="in_progress">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </Form.Select>
            </div>
          </Col>

          {/* Priority Filter */}
          <Col lg={3} md={6}>
            <div className="filter-group">
              <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
                <Flag size={16} className="text-warning" />
                Priority
              </Form.Label>
              <Form.Select
                size="lg"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
                className="border-2"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
              </Form.Select>
            </div>
          </Col>

          {/* Sort By */}
          <Col lg={3} md={6}>
            <div className="filter-group">
              <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
                <ArrowUpDown size={16} className="text-info" />
                Sort By
              </Form.Label>
              <Form.Select
                size="lg"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className="border-2"
              >
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
                <option value="created">Created Date</option>
                <option value="priority">Priority</option>
              </Form.Select>
            </div>
          </Col>

          {/* Sort Order */}
          <Col lg={3} md={6}>
            <div className="filter-group">
              <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
                <ArrowUpDown size={16} className="text-secondary" />
                Order
              </Form.Label>
              <Form.Select
                size="lg"
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters({ ...filters, sortOrder: e.target.value })
                }
                className="border-2"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Form.Select>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};