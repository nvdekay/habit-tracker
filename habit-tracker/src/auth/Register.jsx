import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    InputGroup,
    Button,
    Alert,
    Spinner
} from 'react-bootstrap';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const { register, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setMessage('Confirm password does not match');
            setMessageType('danger');
            return;
        }

        if (formData.password.length < 3) {
            setMessage('Password must be at least 3 characters long');
            setMessageType('danger');
            return;
        }

        if (formData.username.length < 3) {
            setMessage('Username must be at least 3 characters long');
            setMessageType('danger');
            return;
        }

        const { confirmPassword, ...userData } = formData;
        const result = await register(userData);

        if (result.success) {
            setMessage(result.message);
            setMessageType('success');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setMessage(result.message);
            setMessageType('danger');
        }
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card className="shadow-lg border-0">
                            <Card.Body className="p-5">
                                <div className="text-center mb-4">
                                    <UserPlus size={48} className="text-danger mb-3" />
                                    <h2 className="text-dark mb-2">Register</h2>
                                    <p className="text-muted">Create a new account to get started!</p>
                                </div>

                                {(error || message) && (
                                    <Alert
                                        variant={
                                            messageType === 'danger' || error ? 'danger' : 'success'
                                        }
                                    >
                                        {error || message}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3" controlId="fullName">
                                        <Form.Label>Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="Nguyen Van A"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="username">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="username123"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="email@gmail.com"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>Password</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="At least 3 characters"
                                                required
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="confirmPassword">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Re-enter your password"
                                                required
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff size={20} />
                                                ) : (
                                                    <Eye size={20} />
                                                )}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="danger"
                                        size="lg"
                                        className="w-100 mb-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Registering...
                                            </>
                                        ) : (
                                            'Register'
                                        )}
                                    </Button>
                                </Form>

                                <hr />
                                <p className="text-center mb-0">
                                    Already have an account?{' '}
                                    <Link to="/login" className="fw-bold text-decoration-none">
                                        Login now
                                    </Link>
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;
