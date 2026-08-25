import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import FlashBanner from './components/FlashBanner.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Contact from './pages/Contact.jsx';
import Weather from './pages/Weather.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import VerifyOtp from './pages/auth/VerifyOtp.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import CropRecommendation from './pages/predictions/CropRecommendation.jsx';
import CropPrediction from './pages/predictions/CropPrediction.jsx';
import FertilizerRecommendation from './pages/predictions/FertilizerRecommendation.jsx';
import YieldPrediction from './pages/predictions/YieldPrediction.jsx';
import RainfallPrediction from './pages/predictions/RainfallPrediction.jsx';
import ApplyFarmer from './pages/user/ApplyFarmer.jsx';
import PlantDiseasePrediction from './pages/predictions/PlantDiseasePrediction.jsx';

import Dashboard from './pages/user/Dashboard.jsx';
import ChangePassword from './pages/user/ChangePassword.jsx';
import Cart from './pages/user/Cart.jsx';
import Checkout from './pages/user/Checkout.jsx';
import MyOrders from './pages/user/MyOrders.jsx';
import OrderDetails from './pages/user/OrderDetails.jsx';
import TrackOrder from './pages/user/TrackOrder.jsx';
import AddProduct from './pages/user/AddProduct.jsx';
import Wishlist from './pages/user/Wishlist.jsx';
import UserProfile from './pages/user/UserProfile.jsx';
import UserPublic from './pages/user/UserPublic.jsx';
import KhaltiRedirect from './pages/user/KhaltiRedirect.jsx';
import PaymentResult from './pages/user/PaymentResult.jsx';
import EditProduct from './pages/user/EditProduct.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import FarmerOverview from './pages/admin/FarmerOverview.jsx';
import FarmerProducts from './pages/admin/FarmerProducts.jsx';
import FarmerSales from './pages/admin/FarmerSales.jsx';
import FarmerCurrentOrders from './pages/admin/FarmerCurrentOrders.jsx';
import FarmerOrderResults from './pages/admin/FarmerOrderResults.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminMl from './pages/admin/AdminMl.jsx';
import AdminFarm from './pages/admin/AdminFarm.jsx';
import AdminSupport from './pages/admin/AdminSupport.jsx';
import AdminActivityLog from './pages/admin/AdminActivityLog.jsx';
import AdminFarmerApplications from './pages/admin/AdminFarmerApplications.jsx';
import AdminNews from './pages/admin/AdminNews.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login?tab=farmer" state={{ from: location, tab: 'farmer' }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function RequireSuperAdmin({ children }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login?tab=farmer" state={{ from: location, tab: 'farmer' }} replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
}

function RequireFarmer({ children }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login?tab=farmer" state={{ from: location, tab: 'farmer' }} replace />;
  if (isSuperAdmin) return <Navigate to="/super-admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Home />;
  if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  return <Navigate to="/dashboard" replace />;
}

function SiteLayout() {
  return (
    <>
      <Navbar />
      <FlashBanner />
      <main className="container page-body">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/farmer" element={<RequireFarmer><AdminLayout portal="farmer" /></RequireFarmer>}>
        <Route index element={<FarmerOverview />} />
        <Route path="products" element={<FarmerProducts />} />
        <Route path="sales" element={<FarmerSales />} />
        <Route path="orders-current" element={<FarmerCurrentOrders />} />
        <Route path="orders-results" element={<FarmerOrderResults />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="farm" element={<AdminFarm />} />
        <Route path="support" element={<AdminSupport />} />
      </Route>

      <Route path="/super-admin" element={<RequireSuperAdmin><SuperAdminDashboard /></RequireSuperAdmin>}>
      </Route>

      <Route element={<SiteLayout />}>
        <Route index element={<HomeRedirect />} />
        <Route path="about" element={<About />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="contact" element={<Contact />} />
        <Route path="weather" element={<Weather />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="predictions/crop-recommendation" element={<CropRecommendation />} />
        <Route path="predictions/crop-prediction" element={<CropPrediction />} />
        <Route path="predictions/fertilizer-recommendation" element={<FertilizerRecommendation />} />
        <Route path="predictions/yield-prediction" element={<YieldPrediction />} />
        <Route path="predictions/rainfall-prediction" element={<RainfallPrediction />} />
        <Route path="predictions/plant-disease" element={<PlantDiseasePrediction />} />

        <Route path="apply-farmer" element={<RequireAuth><ApplyFarmer /></RequireAuth>} />
        <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
        <Route path="cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="my-orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="order/:id" element={<RequireAuth><OrderDetails /></RequireAuth>} />
        <Route path="track-order/:id" element={<RequireAuth><TrackOrder /></RequireAuth>} />
        <Route path="add-product" element={<RequireAuth><AddProduct /></RequireAuth>} />
        <Route path="edit-product/:id" element={<RequireAuth><EditProduct /></RequireAuth>} />
        <Route path="wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
        <Route path="user-profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="users/:id" element={<UserPublic />} />
        <Route path="payment/khalti" element={<RequireAuth><KhaltiRedirect /></RequireAuth>} />
        <Route path="payment-result" element={<PaymentResult />} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}