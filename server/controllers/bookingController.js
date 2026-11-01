import transporter from "../config/nodemailer.js";
import Booking from "../models/Booking.js"
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";

// function to check availability of room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
    const bookings = await Booking.find({
        room,
        checkInDate: {$lte: checkOutDate},
        checkOutDate: {$gte: checkInDate}
    });
    return bookings.length === 0;
}

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
    try {
        const {room, checkInDate, checkOutDate} = req.body;
        const isAvailable = await checkAvailability({checkInDate, checkOutDate, room});
        res.json({success: true, isAvailable});
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// API to create a new booking
// POST /api/bookings/book

export const createBooking = async (req,res) => {
    try {
        const {room, checkInDate, checkOutDate, guests} = req.body;
        const user = req.user._id;
        // Before booking check availability
        const isAvailable = await checkAvailability({checkInDate, checkOutDate, room});

        if(!isAvailable) {
            return res.json({success: false, message: 'Room is not available'})
        }
        // Get totalPrice of room
        const roomData = await Room.findById(room).populate('hotel');
        let totalPrice = roomData.pricePerNight;

        // Calculate total price based on nights
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        totalPrice *= nights;

        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            guests: +guests,
            checkInDate,
            checkOutDate,
            totalPrice
        })

        const mailOptions = {
            from: process.env.MAIL_FROM, // sender address
            to: req.user.email, // list of recipients
            subject: 'Hotel Booking Details', // subject line
            html: `
                <h2> Your Booking Details</h2>
                <p> Dear ${req.user.username},</p>
                <p> Thank you for your booking! Here are your details:</p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
                    <li><strong>Location:</strong> ${roomData.hotel.address}</li>
                    <li><strong>Date:</strong> ${booking.checkInDate}</li>
                    <li><strong>Booking Amount:</strong> ${process.env.CURRENCY || '$'} ${booking.totalPrice} /night</li>
                </ul>
                <p>We look forward to welcoming you</p>
                <p>If you need to make any chnages, feel free to contact us.</p>
            `, // HTML body
        }

        await transporter.sendMail(mailOptions)

        res.json({success: true, message: 'Booking created successfully'})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: 'failed to create booking'});
    }
}

// API to get all bookings for a user
// GET /api/bookings/user

export const getUserBookings = async (req,res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({user}).populate('room hotel').sort({createdAt: -1})
        res.json({success: true, bookings})
    } catch (error) {
        res.json({success: false, message: 'Failed to fetch bookings'})
    }
}

export const getHotelBookings = async (req,res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.user._id });
        if(!hotel) {
            return res.json({success: false, message: 'No Hotel found'});
        }
        const bookings = await Booking.find({hotel: hotel._id}).populate('room hotel user').sort({createdAt: -1});
        // Total Bookings
        const totalBookings = bookings.length;
        // Total Revenue
        const totalRevenue = bookings.reduce((acc, booking)=>acc + booking.totalPrice, 0)
        res.json({success: true, dashboardData: {totalBookings, totalRevenue, bookings}});
    } catch (error) {
        res.json({success: false, message: 'Failed to fetch bookings'})
    }
}

export const submitBookingReview = async (req, res) => {
    try {
        const {bookingId} = req.params;
        const {rating, reviewText = ''} = req.body;
        const parsedRating = Number(rating);

        if(!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({success: false, message: 'Invalid booking ID'});
        }
        if(!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({success: false, message: 'Rating must be a whole number from 1 to 5'});
        }
        if(typeof reviewText !== 'string' || reviewText.trim().length > 1000) {
            return res.status(400).json({success: false, message: 'Review text must be 1000 characters or fewer'});
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const booking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                user: req.user._id,
                checkOutDate: {$lt: today},
                status: {$ne: 'cancelled'},
                $or: [{rating: {$exists: false}}, {rating: null}]
            },
            {$set: {rating: parsedRating, reviewText: reviewText.trim()}},
            {new: true, runValidators: true}
        );

        if(!booking) {
            const existingBooking = await Booking.findOne({_id: bookingId, user: req.user._id});
            if(!existingBooking) {
                return res.status(404).json({success: false, message: 'Booking not found'});
            }
            if(existingBooking.rating) {
                return res.status(409).json({success: false, message: 'This booking has already been reviewed'});
            }
            if(existingBooking.status === 'cancelled') {
                return res.status(400).json({success: false, message: 'Cancelled bookings cannot be reviewed'});
            }
            return res.status(400).json({success: false, message: 'You can review this booking after its check-out date'});
        }

        res.json({success: true, message: 'Review submitted successfully'});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}

export const getRoomReviews = async (req, res) => {
    try {
        const {roomId} = req.params;
        if(!mongoose.isValidObjectId(roomId)) {
            return res.status(400).json({success: false, message: 'Invalid room ID'});
        }
        const room = await Room.findById(roomId).select('_id');
        if(!room) {
            return res.status(404).json({success: false, message: 'Room not found'});
        }

        const [summary] = await Booking.aggregate([
            {$match: {room: roomId, rating: {$gte: 1, $lte: 5}}},
            {$group: {_id: null, averageRating: {$avg: '$rating'}, totalReviews: {$sum: 1}}}
        ]);
        const bookings = await Booking.find({room: roomId, rating: {$gte: 1, $lte: 5}})
            .populate('user', 'username image')
            .sort({updatedAt: -1});
        const reviews = bookings.map(booking => ({
            rating: booking.rating,
            reviewText: booking.reviewText,
            createdAt: booking.updatedAt,
            username: booking.user?.username || 'Guest',
            userImage: booking.user?.image || ''
        }));

        res.json({
            success: true,
            averageRating: summary ? Number(summary.averageRating.toFixed(1)) : 0,
            totalReviews: summary?.totalReviews || 0,
            reviews
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}

export const getRoomReviewSummaries = async (req, res) => {
    try {
        const summaries = await Booking.aggregate([
            {$match: {rating: {$gte: 1, $lte: 5}}},
            {$group: {
                _id: '$room',
                averageRating: {$avg: '$rating'},
                totalReviews: {$sum: 1}
            }}
        ]);

        res.json({
            success: true,
            summaries: summaries.map(summary => ({
                roomId: summary._id,
                averageRating: Number(summary.averageRating.toFixed(1)),
                totalReviews: summary.totalReviews
            }))
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}