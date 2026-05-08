import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import AdminUpload from "./components/AdminUpload";
import AdminVideo from "./components/AdminVideo";
import AdminUpdate from "./components/AdminUpdate";
import UpdateProblem from "./components/UpdateProblem";
import DailyChallenge from "./pages/DailyChallenge";
import Profile from "./pages/Profile";

// import { GoogleOAuthProvider } from '@react-oauth/google';


function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user} = useSelector((state)=>state.auth);
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



  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/verify" element={<VerifyAccount />} />
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login/>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/verify" element={<VerifyAccount/>}></Route>
      <Route path="/reset-password" element={isAuthenticated?<Navigate to="/" />:<ResetPassword/>}></Route>
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin/>: <Navigate to="/" /> } ></Route>
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel/> : <Navigate to="/" /> } ></Route>
      <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete/> : <Navigate to="/" /> } ></Route>
      <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo/> : <Navigate to='/' /> } ></Route>
      <Route path="/admin/update/:problemId" element={isAuthenticated && user?.role === 'admin' ? <UpdateProblem/> : <Navigate to="/" /> } ></Route>
      <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate/> : <Navigate to="/" /> } ></Route>
      <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload/> : <Navigate to='/' /> } ></Route>
      <Route path="/problem/:problemId" element={ <ProblemPage/> } ></Route>
      <Route path="/daily-challenge" element={isAuthenticated ? <DailyChallenge/> : <Navigate to="/login" />} ></Route>
      <Route path="/profile" element={isAuthenticated ? <Profile/> : <Navigate to="/login" />} ></Route>
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
