import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";
// import { Home } from "./pages/home";

import injectContext from "./store/appContext";

// import { Navbar } from "./component/navbar";
// import { Footer } from "./component/footer";

//import Navbar from "./component/Navbar.jsx"; // Importación del componente Navbar

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
import UserDataDetail from "./component/UserDataDetail.jsx"
import UserBooking from "./component/UserBooking.jsx"
import CreateClasses from "./component/CreateClasses.jsx";
import EditProfile from "./component/EditProfile.jsx";
import MembershipPurchase from "./component/MembershipPurchase.jsx";
import Breadcrumbs from "./component/Breadcrumb.jsx";
import BookingView from "./component/BookingView.jsx";
import Chronometer from "./component/Chronometer.jsx";
import Users from "./component/Users.jsx"; // revisar
import UploadForm from "./component/UploadForm.jsx";
import ImageGallery from "./component/ImageGallery.jsx";
import ProfileImageUpload from "./component/ProfileImageUpload.jsx";
import TransactionsTable from "./component/TransactionsTable.jsx";
import UserCreator from "./component/UserCreator.jsx";
import PRRecord from "./component/PRRecord.jsx";
import AdminMembershipPurchase from "./component/AdminMembershipPurchase.jsx";

import PageNormalUser from "./pages/PageNormalUser.jsx";
import ModulePage from "./pages/ModulePage.jsx";
import CoachPage from "./pages/CoachPage.jsx";
import AdminPage from "./pages/adminPage.jsx";

import MembershipManager from "./component/MembershipManager.jsx";

import ClassesView from "./component/ClassesView.jsx";
import EditClasses from "./component/EditClasses.jsx"

import ExecutePayment from "./component/ExecutePayment.jsx";
import ExecutePaymentAdmin from "./component/ExecutePaymentAdmin.jsx";
import CancelPayment from "./component/ExecutePayment.jsx";

import PasswordResetRequest from "./component/PasswordResetRequest.jsx";
import ResetPassword from "./component/ResetPassword.jsx";

import ClassFrequencyChart from "./component/ClassFrequencyChart.jsx";

import PricingPlans from "./pages/PricingPlans.jsx"
import ImageSlider from "./pages/ImageSlider.jsx"


import Sidebar from "./component/Sidebar.jsx";

import EcommerAdminPage from "./pages/EcommerAdminPage.jsx";

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
                    <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<ConfirmEmail />} path="/ConfirmEmail" />
                        <Route element={<Plans />} path="/Plans" />
                        <Route element={<Users />} path="/users" />
                        <Route element={<Benefits />} path="/Benefits" />
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
                        <Route element={<ClassesView />} path="/ClassesView" />
                        <Route element={<EditClasses />} path="/classEdit/:id" />
                        <Route element={<Chronometer />} path="/Chronometer" />
                        <Route element={<Users />} path="/Users" />
                        <Route element={<UploadForm />} path="/UploadForm" />
                        <Route element={<ImageGallery />} path="/ImageGallery" />
                        <Route element={<ProfileImageUpload />} path="/ProfileImageUpload" />
                        <Route element={<TransactionsTable />} path="/TransactionsTable" />
                        <Route element={<UserCreator />} path="/UserCreator" />
                        <Route element={<PageNormalUser />} path="/Userpage" />
                        <Route element={<CoachPage />} path="/CoachPage" />
                        <Route element={<AdminPage />} path="/AdminPage" />
                        <Route element={<PRRecord />} path="/PRRecord" />
                        <Route element={<AdminMembershipPurchase />} path="/AdminMembershipPurchase" />
                        <Route element={<ExecutePayment />} path="/paypal_payment/execute" />
                        <Route element={<ExecutePaymentAdmin />} path="/paypal_payment/execute_admin" />
                        <Route element={<CancelPayment />} path="/paypal_payment/cancel" />
                        <Route element={<PasswordResetRequest />} path="/PasswordResetRequest" />
                        <Route element={<ResetPassword />} path="/ResetPassword" />
                        <Route element={<ClassFrequencyChart />} path="/ClassFrequencyChart" />
                        <Route element={<h1>Not found!</h1>} />
                        <Route element={<MembershipManager />} />
                        <Route element={<PricingPlans />} path="/PricingPlans" />
                        <Route element={<ImageSlider />} path="/ImageSlider" />
                        <Route element={<EcommerAdminPage />} path="/EcommerAdminPage" />


                    </Routes>
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);
