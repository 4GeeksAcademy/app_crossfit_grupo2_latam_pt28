import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";

// import { Home } from "./pages/home";

import { Single } from "./pages/single";
import injectContext from "./store/appContext";

// import { Navbar } from "./component/navbar";
// import { Footer } from "./component/footer";

import Navbar from "./component/Navbar.jsx"; // Importación del componente Navbar

import  Home  from "./pages/Home.jsx";
import  Footer  from "./component/Footer.jsx";
import  Plans  from "./pages/Plans.jsx";
import Benefits from "./pages/Benefits.jsx"
import ConfirmEmail from "./component/ConfirmEmail.jsx"; // Importación del componente Navbar
import Login from "./component/Login.jsx"; // Importación del componente Navbar
import PrivatePageUser from "./pages/PrivatePageUser.jsx"; // Importación del componente Navbar
import Singup from "./component/Singup.jsx"; 
import BookingView from "./view_master/BookingView.jsx";
import AdminCoachView from "./view_master/AdminCoachActions.jsx";




//create your first component
const Layout = () => {
    //the basename is used when your project is published in a subdirectory and not in the root of the domain
    // you can set the basename on the .env file located at the root of this project, E.g: BASENAME=/react-hello-webapp/
    const basename = process.env.BASENAME || "";

    if(!process.env.BACKEND_URL || process.env.BACKEND_URL == "") return <BackendURL/ >;

    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar /> {/* Renderiza el componente Navbar */}
                    <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<ConfirmEmail />} path="/ConfirmEmail" />
                        <Route element={<Plans />} path="/Plans" />
                        <Route element={<Benefits />} path="/Benefits" />
                        <Route element={<Login />} path="/Login" />
                        <Route element={<Singup />} path="/Singup" />
                        <Route element={<PrivatePageUser />} path="/PrivatePageUser" />
                        <Route element={<BookingView />} path="/AdminBookingView" />
                        <Route element={<AdminCoachView />} path="/AdminCoachActions" />
                        <Route element={<h1>Not found!</h1>} />
                    </Routes>
                    <Footer />
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);
