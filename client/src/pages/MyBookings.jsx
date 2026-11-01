import React, { useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';

const MyBookings = () => {

    const  {axios, getToken, user, fetchReviewSummaries} = useAppContext()
    const [bookings, setBookings] = useState([])
    const [reviewDrafts, setReviewDrafts] = useState({})
    const [submittingReview, setSubmittingReview] = useState(null)

    const fetchUserBookings = async () => {
        try {
            const { data } = await axios.get('/api/bookings/user', {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            });
            if(data.success) {
                setBookings(data.bookings);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const submitReview = async (event, bookingId) => {
        event.preventDefault();
        const draft = reviewDrafts[bookingId];
        if(!draft?.rating) {
            toast.error('Please select a rating');
            return;
        }

        setSubmittingReview(bookingId);
        try {
            const token = await getToken();
            const {data} = await axios.post(`/api/bookings/${bookingId}/review`, draft, {
                headers: {Authorization: `Bearer ${token}`}
            });
            if(data.success) {
                toast.success(data.message);
                await fetchUserBookings();
                await fetchReviewSummaries();
            } else {
                toast.error(data.message);
            }
        } catch(error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmittingReview(null);
        }
    }

    const handlePayment = async (bookingId)=>{
        try{
            const { data } = await axios.post('/api/bookings/stripe-payment',
                {bookingId}, {headers: {Authorization: `Bearer ${await getToken()}`}})
                if(data.success) {
                    window.location.href = data.url
                } else {
                    toast.error(data.message)
                }
        } catch(error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(user) {
            fetchUserBookings()
        }
    },[user])

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>
        <Title title='My Bookings' subTitle='Easily manage your past, current,
        and upcoming hostel reservation in one place. Plan your trips seamlessly with just a few clicks' align='left'/>

        <div className='max-w-6xl mt-8 w-full text-gray-800'>
            <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
                <div className='w-1/3'>Hostels</div>
                <div className='w-1/3'>Date & Timings</div>
                <div className='w-1/3'>Payment</div>
            </div>

            {bookings.map((booking)=>{
                const today = new Date(new Date().toISOString().slice(0, 10));
                const canReview = new Date(booking.checkOutDate) < today && booking.status !== 'cancelled';
                return (
                <div key={booking._id} className="grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t">
                    {/*Hotel Details*/}
                    <div className='flex flex-col md:flex-row'>
                        {booking.room?.images?.[0] ? (
                        <img
                            src={booking.room.images[0]}
                            alt="hotel-img"
                            className='min-md:w-44 rounded shadow object-cover'
                        />
                    ) : (
                        <div className='min-md:w-44 h-32 rounded bg-gray-200 flex items-center justify-center text-sm text-gray-500'>
                            Image unavailable
                        </div>
                    )}
                        <div className='flex flex-col gap-1.5 max-md:mt-3 min-md:ml-4'>
                            <p className='font-playfair text-2xl'>
                                {booking.hotel?.name || 'Hotel unavailable'}
                                <span className='font-inter text-sm'>
                                    ({booking.room?.roomType || 'Room details unavailable'})
                                </span>
                            </p>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.locationIcon} alt="location-icon"/>
                                <span>{booking.hotel?.address || 'Address unavailable'}</span>
                            </div>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.guestsIcon} alt="guests-icon"/>
                                <span>Guests: {booking.guests}</span>
                            </div>
                            <p className='text-base'>Total: {import.meta.env.VITE_CURRENCY || '₹'}{booking.totalPrice}</p>
                        </div>
                    </div>
                    {/*Date & Timings*/}
                    <div className='flex flex-row md:items-center md:gap-12 mt-3 gap-8'>
                        <div>
                            <p>Check-In</p>
                            <p className='text-gray-500 text-sm'>
                                {new Date(booking.checkInDate).toDateString()}
                            </p>
                        </div>
                        <div>
                            <p>Check-Out</p>
                            <p className='text-gray-500 text-sm'>
                                {new Date(booking.checkOutDate).toDateString()}
                            </p>
                        </div>
                    </div>
                    {/*Payment Status*/}
                    <div className='flex flex-col items-start justify-center pt-3'>
                        <div className='flex items-center gap-2'>
                            <div className={`h-3 w-3 rounded-full ${booking.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className={`text-sm ${booking.isPaid ? 'text-green-500' : 'text-red-500'}`}>
                                {booking.isPaid ? 'Paid': 'Unpaid'}
                            </p>
                        </div>
                        {!booking.isPaid && (
                            <button onClick={()=>handlePayment(booking._id)} className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer'>Pay Now</button>
                        )}
                    </div>
                    {canReview && (
                        <div className='md:col-span-3 mt-5 border-t border-gray-200 pt-5'>
                            {booking.rating ? (
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <StarRating rating={booking.rating} />
                                        <span className='text-sm text-gray-600'>Your review</span>
                                    </div>
                                    {booking.reviewText && <p className='mt-2 text-sm text-gray-600'>{booking.reviewText}</p>}
                                </div>
                            ) : (
                                <form onSubmit={(event)=>submitReview(event, booking._id)} className='max-w-xl'>
                                    <p className='font-medium mb-2'>Rate your stay</p>
                                    <div className='flex items-center gap-1 mb-3'>
                                        {Array.from({length: 5}, (_, index)=>(
                                            <button
                                                key={index}
                                                type='button'
                                                aria-label={`Rate ${index + 1} out of 5`}
                                                onClick={()=>setReviewDrafts(previous => ({
                                                    ...previous,
                                                    [booking._id]: {
                                                        ...previous[booking._id],
                                                        rating: index + 1
                                                    }
                                                }))}
                                            >
                                                <img
                                                    src={(reviewDrafts[booking._id]?.rating || 0) > index ? assets.starIconFilled : assets.starIconOutlined}
                                                    alt=''
                                                    className='w-6 h-6'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewDrafts[booking._id]?.reviewText || ''}
                                        onChange={(event)=>setReviewDrafts(previous => ({
                                            ...previous,
                                            [booking._id]: {
                                                ...previous[booking._id],
                                                reviewText: event.target.value
                                            }
                                        }))}
                                        maxLength={1000}
                                        placeholder='Share a few details about your stay (optional)'
                                        className='w-full rounded border border-gray-300 p-3 text-sm'
                                        rows={3}
                                    />
                                    <button
                                        type='submit'
                                        disabled={submittingReview === booking._id}
                                        className='mt-3 rounded bg-primary px-5 py-2 text-sm text-white disabled:opacity-50'
                                    >
                                        {submittingReview === booking._id ? 'Submitting...' : 'Submit review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )})}

        </div>
    </div>
  )
}

export default MyBookings