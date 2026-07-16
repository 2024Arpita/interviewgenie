import React,{createContext,useState,useEffect} from "react"
import axiosInstance from "../utils/axiosInstance"
import { API_PATHS } from "../utils/apiPath"

export const UserContext=createContext();

const UserProvider=({children})=>{
    const [user,setUser]=useState(null);

    const [loading,setLoading]=useState(true); //new state to track loading

     const updateUser=(userData)=>{
        setUser(userData);
        localStorage.setItem("token",userData.token);
        setLoading(false);
    };
    const clearUser=()=>{
        setUser(null);
        localStorage.removeItem("token");
    };
    // useEffect(()=>{
    //     // if(user) return;

    //     const accessToken=localStorage.getItem("token");
    //     if(!accessToken){
    //         setLoading(false);
    //         return;
    //     }

    //     const fetchUser=async ()=>{
    //         try {
    //             const response=await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
    //             setUser(response.data);
    //         } catch (error) {
    //             console.error("User not authenticated",error);
    //             clearUser();
    //         }finally{
    //             setLoading(false);
    //         }

    //     };
    //     fetchUser();
    // },[]);
useEffect(() => {
    console.log("UserProvider mounted");

    const accessToken = localStorage.getItem("token");
    console.log("Token:", accessToken);

    if (!accessToken) {
        console.log("No token");
        setLoading(false);
        return;
    }

    console.log("About to call profile");

    const fetchUser = async () => {
        try {
            console.log("Calling API...");
            const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
            console.log("Profile response:", response.data);
            setUser(response.data);
        } catch (error) {
            console.log("Profile error:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchUser();
}, []);
   

    return (
    <UserContext.Provider
        value={{ user, loading, updateUser, clearUser }}
    >
        {children}
    </UserContext.Provider>
);
};
export default UserProvider;