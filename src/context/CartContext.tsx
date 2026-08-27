import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  categoria?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  lastAddedItem: { product: any; quantity: number } | null;
  dismissNotification: () => void;
  checkoutWhatsApp: (notes?: string, conEnvio?: boolean) => void;
  checkoutInstagram: (notes?: string, conEnvio?: boolean) => Promise<{ success: boolean; message: string; orderCode?: string }>;
  createDatabaseOrder: (metodoPago?: string, notas?: string, conEnvio?: boolean, requireAuth?: boolean) => Promise<{ success: boolean; message: string; orderId?: number; orderCode?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'chunna_cart_items';
const STORE_PHONE = '5491100000000'; // Configurable

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();

  // Inicializar carrito desde localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Error al leer el carrito de localStorage:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ product: any; quantity: number } | null>(null);

  // Persistir en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Error al persistir el carrito:', e);
    }
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const dismissNotification = () => setLastAddedItem(null);

  // Añadir producto al carrito
  const addToCart = (product: any, quantity = 1) => {
    if (!product || !product.id) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            nombre: product.nombre || product.name || 'Accesorio Chunna',
            precio: Number(product.precio || product.price || 0),
            imagen: product.imagen || product.image || '/assets/im1.jpeg',
            categoria: product.categoria || product.category || 'Pulseras',
            quantity
          }
        ];
      }
    });

    // Disparar micro-notificación visual no invasiva
    setLastAddedItem({ product, quantity });

    // Auto-ocultar notificación a los 4 segundos
    setTimeout(() => {
      setLastAddedItem((current) => (current?.product.id === product.id ? null : current));
    }, 4000);
  };

  // Remover producto
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Actualizar cantidad
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // Vaciar carrito
  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn('Error al limpiar localStorage del carrito:', e);
    }
  };

  // Totales calculados
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  // Finalizar compra por WhatsApp
  const checkoutWhatsApp = (notes?: string, conEnvio?: boolean) => {
    if (cart.length === 0) return;

    let message = `¡Hola Chunna Accesorios! ✨ Quiero hacer el siguiente pedido:\n\n`;

    cart.forEach((item, idx) => {
      message += `${idx + 1}. *${item.nombre}*\n`;
      message += `   • Cantidad: ${item.quantity} u.\n`;
      message += `   • Subtotal: ${formatMoney(item.precio * item.quantity)}\n\n`;
    });

    message += `💰 *TOTAL: ${formatMoney(totalPrice)}*\n`;

    if (conEnvio) {
      message += `\n📦 *Envío:* Sí (Quiero envío a domicilio)`;
    } else {
      message += `\n📦 *Envío:* No (Acuerdo entrega / Retiro)`;
    }

    if (user) {
      message += `\n\n👤 *Mis Datos de Comprador:*`;
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

    // Copias de resguardo para armar el mensaje después de limpiar el carrito
    const cartSnapshot = [...cart];
    const priceSnapshot = totalPrice;

    // 1. Intentar registrar pedido en base de datos para obtener el código oficial #PED-XXXX
    let orderCode = `#PED-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const result = await createDatabaseOrder('transferencia', notes, conEnvio, false);
      if (result.success && result.orderCode) {
        orderCode = result.orderCode;
      }
    } catch (e) {
      console.warn('Registro en BD omitido (usando código de respaldo):', e);
    }

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
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (e) {
      console.warn('Fallo al copiar al portapapeles automáticamente:', e);
    }

    // Limpiar carrito tras éxito
    clearCart();

    return {
      success: true,
      message: `¡Pedido ${orderCode} generado y copiado al portapapeles con éxito!`,
      orderCode
    };
  };

  // Crear orden en base de datos
  const createDatabaseOrder = async (
    metodoPago = 'transferencia',
    notas?: string,
    conEnvio?: boolean,
    requireAuth = true
  ) => {
    if (requireAuth && (!isAuthenticated || !token)) {
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            cantidad: item.quantity,
            precio: item.precio
          })),
          total: totalPrice,
          total_price: totalPrice,
          metodo_pago: metodoPago,
          notas: notas || null,
          con_envio: conEnvio || false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'No se pudo registrar el pedido en el servidor.'
        };
      }

      // Limpiar carrito tras éxito si la orden se guardó
      clearCart();

      return {
        success: true,
        message: data.message || 'Pedido registrado con éxito.',
        orderId: data.orderId,
        orderCode: data.orderCode
      };
    } catch (error) {
      console.error('Error al enviar orden al backend:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor al registrar el pedido.'
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
