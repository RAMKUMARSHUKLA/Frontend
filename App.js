import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    TextField,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tab,
    Tabs
} from '@mui/material';
import api from './api';

function App() {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [numberOfSeats, setNumberOfSeats] = useState('');
    const [seats, setSeats] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authDialog, setAuthDialog] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authTab, setAuthTab] = useState(0); // 0 for login, 1 for signup
    const totalSeats = 71;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchSeats();
        }
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/bookings/seats');
            setSeats(response.data);
        } catch (error) {
            console.error('Error fetching seats:', error);
        }
    };

    const handleLogin = async () => {
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
            setAuthDialog(false);
            fetchSeats();
            resetAuthFields();
        } catch (error) {
            alert('Login failed');
        }
    };

    const handleSignup = async () => {
        try {
            const response = await api.post('/auth/signup', { email, password });
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
            setAuthDialog(false);
            fetchSeats();
            resetAuthFields();
        } catch (error) {
            alert('Signup failed');
        }
    };

    const resetAuthFields = () => {
        setEmail('');
        setPassword('');
        setAuthTab(0);
    };

    const handleAuthClose = () => {
        setAuthDialog(false);
        resetAuthFields();
    };

    const handleSeatClick = (seatNumber) => {
        if (selectedSeats.includes(seatNumber)) {
            setSelectedSeats(selectedSeats.filter((seat) => seat !== seatNumber));
        } else if (selectedSeats.length < 7) {  // Limit to 7 seats
            setSelectedSeats([...selectedSeats, seatNumber]);
        } else {
            alert('You can only select up to 7 seats at a time');
        }
    };

    const handleBooking = async () => {
        if (!isLoggedIn) {
            setAuthDialog(true);
            return;
        }

        if (!numberOfSeats || numberOfSeats <= 0) {
            alert('Please enter a valid number of seats');
            return;
        }

        if (numberOfSeats > 7) {
            alert('You can only book up to 7 seats at a time');
            return;
        }

        try {
            const response = await api.post('/bookings/book', {
                numberOfSeats: parseInt(numberOfSeats)
            });

            await fetchSeats(); // Refresh seats after booking

            alert(`Booking successful! Booking ID: ${response.data.bookingId}\nSeats: ${
                response.data.seats.map(seat => seat.seatNumber).join(', ')
            }`);

            // handleReset();
            // Clear selected seats after successful booking
            setSelectedSeats([]);
            setNumberOfSeats('');
        } catch (error) {
            alert(error.response?.data?.error || 'Booking failed');
            console.error('Booking error:', error);
        }
    };

    const handleReset = async () => {
        try {
            // Reset local state
            setSelectedSeats([]);
            setNumberOfSeats('');
            if (isLoggedIn) {
                // Call backend to reset bookings
                await api.post('/bookings/reset');
            }
            // Refresh seats data from server
            await fetchSeats();
        } catch (error) {
            console.error('Error resetting booking:', error);
            alert('Failed to reset booking');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setSeats([]);
        handleReset();
    };

    // Function to determine if a seat is booked
    const isSeatBooked = (seatNumber) => {
        return seats.some(seat => seat.seat_number === seatNumber && seat.is_booked);
    };

    // Function to get seat color
    const getSeatColor = (seatNumber) => {
        if (isSeatBooked(seatNumber)) {
            return '#ff0000'; // Red for booked seats
        }
        if (selectedSeats.includes(seatNumber)) {
            return '#2196f3'; // Blue for selected seats
        }
        return '#4caf50'; // Green for available seats
    };

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h3" component="h1">
                        Ticket Booking
                    </Typography>
                    {isLoggedIn ? (
                        <Button variant="outlined" color="primary" onClick={handleLogout}>
                            Logout
                        </Button>
                    ) : (
                        <Button variant="contained" color="primary" onClick={() => setAuthDialog(true)}>
                            Login/Signup
                        </Button>
                    )}
                </Box>

                {/* Auth Dialog */}
                <Dialog open={authDialog} onClose={handleAuthClose} maxWidth="xs" fullWidth>
                    <DialogTitle>
                        <Tabs value={authTab} onChange={(e, newValue) => setAuthTab(newValue)} centered>
                            <Tab label="Login" />
                            <Tab label="Sign Up" />
                        </Tabs>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Email"
                                type="email"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                margin="dense"
                                label="Password"
                                type="password"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <TextField
                                type="number"
                                label="Number of Seats"
                                value={numberOfSeats}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNumberOfSeats(value);
                                    // Reset selected seats when number changes
                                    setSelectedSeats([]);
                                }}
                                InputProps={{
                                    inputProps: {
                                        min: 1,
                                        max: 7
                                    }
                                }}
                                fullWidth
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleAuthClose}>Cancel</Button>
                        <Button onClick={authTab === 0 ? handleLogin : handleSignup}>
                            {authTab === 0 ? 'Login' : 'Sign Up'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Grid container spacing={3}>
                    {/* Seats Grid */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={1}>
                                    {Array.from({ length: totalSeats }, (_, index) => {
                                        const seatNumber = index + 1;
                                        const isLastRow = Math.floor(index / 7) === Math.floor((totalSeats - 1) / 7);
                                        const shouldRender = !isLastRow || (isLastRow && index % 7 < 3);

                                        return shouldRender ? (
                                            <Grid item xs={12/7} key={seatNumber}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => handleSeatClick(seatNumber)}
                                                    disabled={isSeatBooked(seatNumber)}
                                                    sx={{
                                                        height: '48px',
                                                        bgcolor: getSeatColor(seatNumber),
                                                        '&:hover': {
                                                            bgcolor: getSeatColor(seatNumber),
                                                            opacity: 0.9
                                                        }
                                                    }}
                                                >
                                                    {seatNumber}
                                                </Button>
                                            </Grid>
                                        ) : null;
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Booking Form */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Book Seats
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    type="number"
                                    label="Number of Seats"
                                    value={numberOfSeats}
                                    onChange={(e) => setNumberOfSeats(e.target.value)}
                                    InputProps={{
                                        inputProps: {
                                            min: 1,
                                            max: 7
                                        }
                                    }}
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleBooking}
                                    fullWidth
                                    disabled={!numberOfSeats || numberOfSeats <= 0}
                                >
                                    Book
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    fullWidth
                                >
                                    Reset Booking
                                </Button>
                            </Box>

                            {/* Seat Legend */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Seat Legend:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50' }} />
                                        <Typography variant="body2">Available</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 20, height: 20, bgcolor: '#2196f3' }} />
                                        <Typography variant="body2">Selected</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 20, height: 20, bgcolor: '#ff0000' }} />
                                        <Typography variant="body2">Booked</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default App;

