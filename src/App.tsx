import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import CartDrawer from './components/CartDrawer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-container">
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          <Header />
          <main id="main-content" tabIndex={-1}>
            <Hero />
            <ProductList />
            <ContactForm />
          </main>
          <Footer />
          
          {/* Modales globales de Autenticación, Perfil, Panel de Administrador y Carrito */}
          <CartDrawer />
          <AuthModal />
          <ProfileModal />
          <AdminDashboardModal />
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
