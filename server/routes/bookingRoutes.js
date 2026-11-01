import express from 'express';
import { checkAvailabilityAPI, createBooking, getHotelBookings, getUserBookings, getRoomReviews, getRoomReviewSummaries, submitBookingReview } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkAvailabilityAPI);
bookingRouter.post('/book', protect, createBooking);
bookingRouter.get('/user', protect, getUserBookings);
bookingRouter.get('/hotel', protect, getHotelBookings);
bookingRouter.post('/:bookingId/review', protect, submitBookingReview);
bookingRouter.get('/reviews/summary', getRoomReviewSummaries);
bookingRouter.get('/reviews/room/:roomId', getRoomReviews);

export default bookingRouter;