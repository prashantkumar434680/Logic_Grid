import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect, useState } from "react";
import AdminPanel from "./pages/AdminPanel";
import ResetPassword from "./pages/ResetPassword";
import { GoogleOAuthProvider } from '@react-oauth/google';


function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated} = useSelector((state)=>state.auth);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  // "dotenv".config();

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      setAuthCheckComplete(true);
    });
  }, [dispatch]);


  
  if (!authCheckComplete) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  // const GoogleAuthWrapper = ()=>{
  //   return(
  //     <GoogleAuthWrapper cientId={process.env.clientId}>
  //       <Login></Login>
  //     </GoogleAuthWrapper>
  //   )
  // }


  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login/>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/reset-password" element={isAuthenticated?<Navigate to="/" />:<ResetPassword/>}></Route>
      <Route path="/admin" element={<AdminPanel/>}></Route>
      {/* <Route 
        path="/admin" 
        element={
          isAuthenticated && user?.role === 'admin' ? 
            <AdminPanel /> : 
            <Navigate to="/" />
        } 
      /> */}
    </Routes>
  </>
  )
}

export default App;
