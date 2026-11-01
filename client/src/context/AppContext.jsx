import axios from 'axios';
import { createContext, use, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/react';
import { toast } from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL

const AppContext = createContext();

export const AppProvider = ({children}) => {
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const navigate = useNavigate();
    const { user } = useUser();
    const { getToken } = useAuth();

    const [isOwner, setIsOwner] = useState(null);
    const [showHotelReg, setShowHotelReg] = useState(false);
    const [searchedCities, setSearchedCities] = useState([])
    const [rooms, setRooms] = useState([])
    const [reviewSummaries, setReviewSummaries] = useState({})

    const fetchUser = async ()=> {
        try {
            const {data} = await axios.get('/api/user', {headers: {Authorization: `Bearer ${await getToken()}`}});
            if(data.success) {
                setIsOwner(data.role === 'hotelOwner');
                setSearchedCities(Array.isArray(data.recentSearchedCities) ? data.recentSearchedCities : []);
            } else {
                setTimeout(() => {
                    fetchUser()
                }, 5000);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchRooms = async ()=>{
        try {
            const {data} = await axios.get('/api/rooms')
            if(data.success) {
                setRooms(data.rooms)
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(user) {
            fetchUser()
        }
    },[user])

    useEffect(()=>{
        fetchRooms()
    },[])

    const fetchReviewSummaries = async () => {
        try {
            const {data} = await axios.get('/api/bookings/reviews/summary')
            if(data.success) {
                setReviewSummaries(Object.fromEntries(
                    data.summaries.map(summary => [summary.roomId, summary])
                ))
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    useEffect(()=>{
        fetchReviewSummaries()
    },[])

    const value = {
        currency, navigate, user, getToken, isOwner, setIsOwner, axios,
        showHotelReg, setShowHotelReg, searchedCities, setSearchedCities,
        rooms, setRooms, reviewSummaries, fetchReviewSummaries
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext);