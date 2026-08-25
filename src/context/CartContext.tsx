import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../components/ProductCard';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  lastAddedItem: { product: Product; quantity: number } | null;
  dismissNotification: () => void;
  checkoutWhatsApp: (notes?: string, conEnvio?: boolean) => void;
  checkoutInstagram: (notes?: string, conEnvio?: boolean) => Promise<{ success: boolean; message: string; orderCode?: string }>;
  createDatabaseOrder: (metodoPago?: string, notas?: string, conEnvio?: boolean) => Promise<{ success: boolean; message: string; orderId?: number; orderCode?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'chunna_cart_items';
const STORE_PHONE = '549341000000'; // Número oficial de WhatsApp de la tienda

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error cargando carrito local:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ product: Product; quantity: number } | null>(null);

  // Sincronizar carrito con localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error guardando carrito local:', e);
    }
  }, [cart]);

  // Auto ocultar notificación después de 4.5 segundos
  useEffect(() => {
    if (lastAddedItem) {
      const timer = setTimeout(() => {
        setLastAddedItem(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  const openCart = () => {
    setLastAddedItem(null);
    setIsCartOpen(true);
  };
  const closeCart = () => setIsCartOpen(false);
  const dismissNotification = () => setLastAddedItem(null);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });

    // Feedback mínimo no bloqueante (toast card)
    setLastAddedItem({ product, quantity });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  // Formatear precio para mensajes
  const formatMoney = (val: number) => `$${new Intl.NumberFormat('es-AR').format(val)}`;

  // Finalizar compra por WhatsApp
  const checkoutWhatsApp = (notes?: string, conEnvio?: boolean) => {
    if (cart.length === 0) return;

    let message = `¡Hola Chunna Accesorios! ✨\nQuiero realizar el siguiente pedido:\n\n`;
    
    cart.forEach((item, idx) => {
      message += `${idx + 1}. *${item.nombre}*\n`;
      message += `   • Cantidad: ${item.quantity} u.\n`;
      message += `   • Subtotal: ${formatMoney(item.precio * item.quantity)}\n\n`;
    });

    message += `💰 *TOTAL A PAGAR: ${formatMoney(totalPrice)}*\n`;

    if (conEnvio) {
      message += `\n📦 *Envío:* Sí (Quiero envío a domicilio)\n`;
    } else {
      message += `\n📦 *Envío:* No (Acuerdo entrega / Retiro)\n`;
    }

    if (user) {
      message += `\n👤 *Datos del Comprador:*`;
      message += `\n• Nombre: ${user.name}`;
      if (user.phone) message += `\n• Teléfono: ${user.phone}`;
      if (user.city) message += `\n• Ciudad: ${user.city}`;
      if (user.address) message += `\n• Dirección: ${user.address}`;
    }

    if (notes && notes.trim().length > 0) {
      message += `\n\n📝 *Notas del Pedido:* ${notes.trim()}`;
    }

    message += `\n\n¿Cómo podemos coordinar el pago y la entrega? ¡Muchas gracias! 💕`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${STORE_PHONE}?text=${encodedMessage}`, '_blank');
  };

  // Finalizar compra por Instagram (Copia al portapapeles y Redirección)
  const checkoutInstagram = async (notes?: string, conEnvio?: boolean): Promise<{ success: boolean; message: string; orderCode?: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    // Copias de resguardo para armar el mensaje después de limpiar el carrito en createDatabaseOrder
    const cartSnapshot = [...cart];
    const priceSnapshot = totalPrice;

    // 1. Guardar pedido en base de datos para generar el código #PED-XXXX
    const result = await createDatabaseOrder('transferencia', notes, conEnvio);
    if (!result.success || !result.orderCode) {
      return {
        success: false,
        message: result.message || 'No se pudo registrar el pedido en la base de datos.'
      };
    }

    const orderCode = result.orderCode;

    // 2. Construir el mensaje detallado del pedido
    let message = `¡Hola Chunna Accesorios! ✨\nQuiero realizar el siguiente pedido (Código: ${orderCode}):\n\n`;

    cartSnapshot.forEach((item, idx) => {
      message += `${idx + 1}. ${item.nombre}\n`;
      message += `   • Cantidad: ${item.quantity} u.\n`;
      message += `   • Subtotal: ${formatMoney(item.precio * item.quantity)}\n\n`;
    });

    message += `💰 TOTAL A PAGAR: ${formatMoney(priceSnapshot)}\n`;

    if (conEnvio) {
      message += `\n📦 Envío: Sí (Quiero envío a domicilio)\n`;
    } else {
      message += `\n📦 Envío: No (Acuerdo entrega / Retiro)\n`;
    }

    if (user) {
      message += `\n👤 Datos del Comprador:`;
      message += `\n• Nombre: ${user.name}`;
      if (user.phone) message += `\n• Teléfono: ${user.phone}`;
      if (user.city) message += `\n• Ciudad: ${user.city}`;
      if (user.address) message += `\n• Dirección: ${user.address}`;
    }

    if (notes && notes.trim().length > 0) {
      message += `\n\n📝 Notas del Pedido: ${notes.trim()}`;
    }

    message += `\n\nHe copiado este detalle para enviártelo. ¿Cómo coordinamos el pago y la entrega? ¡Muchas gracias! 💕`;

    // 3. Copiar al portapapeles automáticamente
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        // Fallback para navegadores antiguos o entornos sin HTTPS seguro
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed'; // Evitar scroll
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (e) {
      console.warn('Fallo al copiar al portapapeles automáticamente:', e);
    }

    return {
      success: true,
      message: `¡Pedido ${orderCode} registrado y copiado al portapapeles!`,
      orderCode
    };
  };

  // Crear orden en base de datos
  const createDatabaseOrder = async (metodoPago = 'transferencia', notas?: string, conEnvio?: boolean) => {
    if (!isAuthenticated || !token) {
      return {
        success: false,
        message: 'Debes iniciar sesión para guardar el pedido en tu cuenta.'
      };
    }

    if (cart.length === 0) {
      return {
        success: false,
        message: 'El carrito está vacío.'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            cantidad: item.quantity,
            precio: item.precio
          })),
          total: totalPrice,
          metodo_pago: metodoPago,
          notas: notas || null,
          con_envio: conEnvio || false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'No se pudo registrar el pedido.'
        };
      }

      // Limpiar carrito tras éxito
      clearCart();

      return {
        success: true,
        message: data.message || 'Pedido creado con éxito.',
        orderId: data.orderId,
        orderCode: data.orderCode
      };
    } catch (error) {
      console.error('Error al enviar orden a la BD:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor al procesar el pedido.'
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        lastAddedItem,
        dismissNotification,
        checkoutWhatsApp,
        checkoutInstagram,
        createDatabaseOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;
