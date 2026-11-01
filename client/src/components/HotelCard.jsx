import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import StarRating from './StarRating'
import { useAppContext } from '../context/AppContext'

const HotelCard = ({ room, index }) => {
    const {reviewSummaries} = useAppContext()
    const reviewSummary = reviewSummaries[room._id]

    return (
        <Link to={'/rooms/' + room._id} onClick={() => scrollTo(0, 0)} key={room._id}  className="relative max-w-70 w-full rounded-xl overflow-hidden bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]" >
            <img src={room.images[0]} alt=""/>
            {index % 2 === 0 && <p className='px-3 py-1 absolute top-3 left-3 text-xs bg-white text-gray-800 font-medium rounded-full'>Best Seller</p>}
            <div className='p-4 pt-5'>
                <div className='flex items-center justify-between'>
                    <p className='font-playfair text-xl font-medium text-gray-800'>{room.hotel.name}</p>
                    <div className='flex items-center gap-1'>
                        {reviewSummary?.totalReviews ? (
                            <>
                                <StarRating rating={Math.round(reviewSummary.averageRating)} />
                                <span>{reviewSummary.averageRating.toFixed(1)}</span>
                            </>
                        ) : (
                            <span className='text-xs text-gray-500'>No reviews yet</span>
                        )}
                    </div>
                </div>
                {reviewSummary?.totalReviews > 0 && (
                    <p className='mt-1 text-xs text-gray-500'>
                        {reviewSummary.totalReviews} {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                )}
                <div className='flex items-center gap-1 text-sm'>
                    <img src={assets.locationIcon} alt="location-icon" />
                    <span>{room.hotel.address}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <p>
                        <span className="text-xl text-gray-800">
                            {import.meta.env.VITE_CURRENCY || '₹'}{room.pricePerNight}
                        </span>/night
                    </p>
                    <button className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-all cursor-pointer">
                    Book Now
                    </button>
                </div>
            </div>
        </Link>
    )
}

export default HotelCard