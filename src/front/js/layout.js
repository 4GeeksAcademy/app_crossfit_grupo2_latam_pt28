import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";
import Homeadmin from "./pages/Homeadmin.jsx";
// import { Home } from "./pages/home";

import { Single } from "./pages/single";
import injectContext from "./store/appContext";

// import { Navbar } from "./component/navbar";
// import { Footer } from "./component/footer";

import Navbar from "./component/Navbar.jsx"; // Importación del componente Navbar

import Home from "./pages/Home.jsx";
import Footer from "./component/Footer.jsx";
import Plans from "./pages/Plans.jsx";
import Benefits from "./pages/Benefits.jsx"
import ConfirmEmail from "./component/ConfirmEmail.jsx"; // Importación del componente Navbar
import Login from "./component/Login.jsx"; // Importación del componente Navbar
import PrivatePageUser from "./pages/PrivatePageUser.jsx"; // Importación del componente Navbar
import Singup from "./component/Singup.jsx";
import SingupMaster from "./component/SingupMaster.jsx";
import Calendar from "./component/Calendar.jsx";
import PrivateCalendar from "./component/PrivateCalendar.jsx";
import UserDataDetail from "./pages/UserDataDetail.jsx"
import UserBooking from "./pages/UserBooking.jsx"
import CreateClasses from "./component/CreateClasses.jsx";
import ModulePage from "./pages/ModulePage.jsx";
import EditProfile from "./component/EditProfile.jsx";
import MembershipPurchase from "./component/MembershipPurchase.jsx";
import Breadcrumbs from "./component/Breadcrumb.jsx";
import BookingView from "./component/BookingView.jsx";
import ClassEdit from "./component/MasterClassEdit.jsx";
import AdminCoachView from "./view_master/AdminCoachActions.jsx";
import Users from "./pages/Users.jsx"; // revisar
import Oneuser from "./pages/Oneuser.jsx"; // revisar
// import Homeadmin from "./pages/Homeadmin.jsx"; // revisar
import Menuadmin from "./component/Menuadmin.jsx"; // revisar
import UploadForm from "./component/UploadForm.jsx";
import ImageGallery from "./component/ImageGallery.jsx";

//create your first component
const Layout = () => {
    //the basename is used when your project is published in a subdirectory and not in the root of the domain
    // you can set the basename on the .env file located at the root of this project, E.g: BASENAME=/react-hello-webapp/
    const basename = process.env.BASENAME || "";

    if (!process.env.BACKEND_URL || process.env.BACKEND_URL == "") return <BackendURL />;

    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar /> {/* Renderiza el componente Navbar */}
                    <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<ConfirmEmail />} path="/ConfirmEmail" />
                        <Route element={<Plans />} path="/Plans" />
                        <Route element={<Homeadmin />} path="/Admin" />
                        <Route element={<Users />} path="/users" />
                        <Route element={<Benefits />} path="/Benefits" />
                        <Route element={<Oneuser />} path="/User/:id" />
                        <Route element={<Login />} path="/Login" />
                        <Route element={<Singup />} path="/Singup" />
                        <Route element={<SingupMaster />} path="/Master-private-registration" />
                        <Route element={<Calendar />} path="/Calendar" />
                        <Route element={<PrivateCalendar />} path="/PrivateCalendar" />
                        <Route element={<PrivatePageUser />} path="/PrivatePageUser" />
                        <Route element={<UserDataDetail />} path="/UserDataDetail" />
                        <Route element={<UserBooking />} path="/UserBooking" />
                        <Route element={<EditProfile />} path="/EditProfile" />
                        <Route element={<MembershipPurchase />} path="/MembershipPurchase" />
                        <Route element={<CreateClasses />} path="/CreateClasses" />
                        <Route element={<ModulePage />} path="/ModulePage" />
                        <Route element={<BookingView />} path="/BookingView" />
                        <Route element={<Users />} path="/Users" />
                        <Route element={<Oneuser />} path="/Oneuser" />
                        {/* <Route element={<Homeadmin />} path="/Homeadmin" /> */}
                        <Route element={<Menuadmin />} path="/Menuadmin" />
                        <Route element={<UploadForm />} path="/UploadForm" />
                        <Route element={<ImageGallery />} path="/ImageGallery" />
                        <Route element={<h1>Not found!</h1>} />
                    </Routes>
                    <Footer />
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);
