import React, { useState, useEffect } from 'react';
import {
  Modal,
  Nav,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap';
import { useAuth, User } from '../context/AuthContext';
import { API_BASE_URL, getImageUrl } from '../config/api';

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalStock: number;
}

interface OrderItem {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  total: number;
  estado: 'pendiente' | 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
  metodo_pago: string;
  notas?: string | null;
  created_at?: string;
  con_envio?: boolean;
}

export interface ProductItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen?: string | null;
  categoria: string;
  activo: boolean | number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interfaz para los productos procesados en la Carga Masiva con IA
 */
export interface BulkAIProductItem {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMsg?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number | string;
  stock: number | string;
}

export const AdminDashboardModal: React.FC = () => {
  const {
    token,
    isAdmin,
    user,
    adminDashboardOpen,
    setAdminDashboardOpen,
    triggerProductsRefresh
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'users' | 'products' | 'addProduct' | 'bulkAi'>('stats');

  // Estados de datos
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros de búsqueda
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // =========================================================================
  // ESTADOS PARA EDICIÓN DE CLIENTES / USUARIOS
  // =========================================================================
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserCity, setEditUserCity] = useState('');
  const [editUserNotes, setEditUserNotes] = useState('');

  // =========================================================================
  // ESTADOS PARA EDICIÓN DE PRODUCTOS
  // =========================================================================
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [savingEditProduct, setSavingEditProduct] = useState(false);
  const [editProdNombre, setEditProdNombre] = useState('');
  const [editProdPrecio, setEditProdPrecio] = useState('');
  const [editProdStock, setEditProdStock] = useState('10');
  const [editProdCategoria, setEditProdCategoria] = useState('Pulseras');
  const [editProdImagen, setEditProdImagen] = useState('/assets/im1.jpeg');
  const [editProdDescripcion, setEditProdDescripcion] = useState('');
  const [editProdActivo, setEditProdActivo] = useState(true);

  // Formulario nuevo producto individual
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodStock, setProdStock] = useState('15');
  const [prodCategoria, setProdCategoria] = useState('Pulseras');
  const [prodImagen, setProdImagen] = useState('/assets/im1.jpeg');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Estados para subida de imagen por Drag & Drop individual
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Estado para autocompletar con IA en carga individual
  const [analyzingSingleAI, setAnalyzingSingleAI] = useState(false);

  // =========================================================================
  // ESTADOS Y REFERENCIAS PARA CARGA MASIVA CON INTELIGENCIA ARTIFICIAL
  // =========================================================================
  const [bulkQueue, setBulkQueue] = useState<BulkAIProductItem[]>([]);
  const [bulkDragActive, setBulkDragActive] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const bulkFileInputRef = React.useRef<HTMLInputElement>(null);

  // Revocar ObjectURL al desmontar o cambiar de preview para prevenir fugas de memoria
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      bulkQueue.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [imagePreview, bulkQueue]);

  // Manejadores del área Drag & Drop individual
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor sube un archivo de imagen válido (JPG, PNG, WEBP, etc.).');
      return;
    }

    setErrorMsg(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(objectUrl);
    setProdImagen(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setProdImagen('/assets/im1.jpeg');
  };

  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * =========================================================================
   * FUNCIONES DE INTELIGENCIA ARTIFICIAL (GOOGLE GEMINI)
   * =========================================================================
   */

  const handleAutofillWithAI = async () => {
    if (!imageFile) {
      setErrorMsg('Primero sube o arrastra una imagen para poder analizarla con IA.');
      return;
    }

    try {
      setAnalyzingSingleAI(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('image', imageFile);

      const res = await fetch(`${API_BASE_URL}/admin/ai/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al procesar la imagen con IA.');
      }

      if (data.imageUrl) {
        setProdImagen(data.imageUrl);
      }

      if (data.analysis) {
        if (data.analysis.nombre) setProdNombre(data.analysis.nombre);
        if (data.analysis.descripcion) setProdDescripcion(data.analysis.descripcion);
        if (data.analysis.categoria) setProdCategoria(data.analysis.categoria);
        if (data.analysis.precio) setProdPrecio(String(data.analysis.precio));
        if (data.analysis.stock) setProdStock(String(data.analysis.stock));
      }

      setSuccessMsg('✨ ¡Campos autocompletados con Inteligencia Artificial con éxito!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error en análisis individual de IA:', err);
      setErrorMsg(err.message || 'Error al analizar la imagen con IA.');
    } finally {
      setAnalyzingSingleAI(false);
    }
  };

  const handleBulkDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBulkDragActive(true);
    } else if (e.type === "dragleave") {
      setBulkDragActive(false);
    }
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBulkDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToBulkQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFilesToBulkQueue(Array.from(e.target.files));
    }
  };

  const addFilesToBulkQueue = (files: File[]) => {
    const validImageFiles = files.filter(f => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setErrorMsg('No se seleccionaron archivos de imagen válidos.');
      return;
    }

    const newItems: BulkAIProductItem[] = validImageFiles.map(file => {
      const preview = URL.createObjectURL(file);
      const randomId = Math.random().toString(36).substring(2, 9);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      return {
        id: randomId,
        file,
        previewUrl: preview,
        status: 'pending',
        nombre: capitalized || 'Pulsera Artesanal',
        descripcion: 'Diseño artesanal tejido a mano con materiales seleccionados de Chunna Accesorios.',
        categoria: 'Pulseras',
        precio: 1500,
        stock: 10
      };
    });

    setBulkQueue(prev => [...prev, ...newItems]);
    setSuccessMsg(`Se agregaron ${newItems.length} imágenes a la cola de procesamiento.`);
    setTimeout(() => setSuccessMsg(null), 3000);

    newItems.forEach(item => {
      analyzeQueueItemWithAI(item.id, item.file);
    });
  };

  const analyzeQueueItemWithAI = async (itemId: string, file: File) => {
    setBulkQueue(prev => prev.map(item => item.id === itemId ? { ...item, status: 'analyzing' } : item));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/admin/ai/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error en el análisis de Gemini.');
      }

      setBulkQueue(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'done',
            uploadedUrl: data.imageUrl,
            nombre: data.analysis?.nombre || item.nombre,
            descripcion: data.analysis?.descripcion || item.descripcion,
            categoria: data.analysis?.categoria || item.categoria,
            precio: data.analysis?.precio || item.precio,
            stock: data.analysis?.stock || item.stock
          };
        }
        return item;
      }));
    } catch (err: any) {
      console.error(`Error analizando imagen del ítem ${itemId}:`, err);
      setBulkQueue(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'error',
            errorMsg: err.message || 'Fallo al procesar con IA'
          };
        }
        return item;
      }));
    }
  };

  const handleBulkItemChange = (id: string, field: keyof BulkAIProductItem, value: any) => {
    setBulkQueue(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveBulkItem = (id: string) => {
    setBulkQueue(prev => {
      const itemToRemove = prev.find(i => i.id === id);
      if (itemToRemove && itemToRemove.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearBulkQueue = () => {
    bulkQueue.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setBulkQueue([]);
  };

  const handleSaveBulkProducts = async () => {
    if (bulkQueue.length === 0) return;

    try {
      setSavingBulk(true);
      setErrorMsg(null);

      const payload = bulkQueue.map(item => ({
        nombre: item.nombre.trim(),
        descripcion: item.descripcion.trim(),
        categoria: item.categoria,
        precio: Number(item.precio) || 0,
        stock: Number(item.stock) || 10,
        imagen: item.uploadedUrl || '/assets/im1.jpeg',
        activo: 1
      }));

      const res = await fetch(`${API_BASE_URL}/admin/ai/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ products: payload })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar los productos masivos.');
      }

      setSuccessMsg(`🎉 ¡Éxito! Se crearon ${data.insertedCount || bulkQueue.length} productos en el catálogo de Chunna.`);
      handleClearBulkQueue();
      triggerProductsRefresh();
      fetchAdminData();
    } catch (err: any) {
      console.error('Error al guardar productos masivos:', err);
      setErrorMsg(err.message || 'Error al guardar productos en el catálogo.');
    } finally {
      setSavingBulk(false);
    }
  };

  // =========================================================================
  // CARGA DE DATOS GENERALES
  // =========================================================================
  const fetchAdminData = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Cargar Estadísticas
      const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      // 2. Cargar Pedidos
      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      // 3. Cargar Usuarios/Clientes
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 4. Cargar Catálogo de Productos para Administración
      const productsRes = await fetch(`${API_BASE_URL}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (err: any) {
      console.warn('Error al cargar datos del panel de administración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminDashboardOpen && isAdmin) {
      fetchAdminData();
    }
  }, [adminDashboardOpen, isAdmin]);

  // Actualizar estado de un pedido
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: newStatus })
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus as any } : o))
        );
        setSuccessMsg(`Pedido #${orderId} actualizado a "${newStatus}".`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('No se pudo actualizar el estado del pedido.');
    }
  };

  // Crear nuevo producto individual
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!prodNombre.trim() || !prodPrecio || isNaN(Number(prodPrecio))) {
      setErrorMsg('Por favor completa el nombre y un precio numérico válido.');
      return;
    }

    setSavingProduct(true);
    try {
      let finalImagenUrl = prodImagen;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch(`${API_BASE_URL}/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Error al subir la imagen al servidor.');
        }
        finalImagenUrl = uploadData.url;
      }

      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: prodNombre.trim(),
          descripcion: prodDescripcion.trim() || undefined,
          precio: Number(prodPrecio),
          stock: Number(prodStock) || 10,
          categoria: prodCategoria,
          imagen: finalImagenUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al guardar el producto.');
      } else {
        setSuccessMsg('¡Producto añadido con éxito al catálogo!');
        setProdNombre('');
        setProdPrecio('');
        setProdDescripcion('');
        setProdStock('15');
        handleRemoveImage();
        triggerProductsRefresh();
        fetchAdminData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setSavingProduct(false);
    }
  };

  // =========================================================================
  // GESTIÓN Y ACCIONES DE CLIENTES (EDITAR Y ELIMINAR)
  // =========================================================================

  const handleOpenEditUser = (client: User) => {
    setEditingUser(client);
    setEditUserName(client.name || '');
    setEditUserEmail(client.email || '');
    setEditUserPhone(client.phone || '');
    setEditUserAddress(client.address || '');
    setEditUserCity(client.city || '');
    setEditUserNotes(client.notes || '');
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;

    if (!editUserName.trim() || !editUserEmail.trim()) {
      setErrorMsg('El nombre y correo del cliente son obligatorios.');
      return;
    }

    try {
      setSavingUser(true);
      setErrorMsg(null);

      const res = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName.trim(),
          email: editUserEmail.trim(),
          phone: editUserPhone.trim() || null,
          address: editUserAddress.trim() || null,
          city: editUserCity.trim() || null,
          notes: editUserNotes.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar el cliente.');
      }

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data.user } : u));
      setShowEditUserModal(false);
      setSuccessMsg(`¡Cliente "${editUserName}" actualizado correctamente!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar el cliente.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string, userEmail: string) => {
    if (!token) return;

    if (userEmail.toLowerCase() === 'cunna.accs@gmail.com') {
      alert('Por seguridad no está permitido eliminar la cuenta del Administrador principal.');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente la cuenta de "${userName}" (${userEmail})?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setErrorMsg(null);
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al eliminar el cliente.');
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccessMsg(`Cuenta de "${userName}" eliminada correctamente.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo eliminar el cliente.');
    }
  };

  // =========================================================================
  // GESTIÓN Y ACCIONES DE PRODUCTOS (EDITAR Y ELIMINAR)
  // =========================================================================

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditProdNombre(prod.nombre || '');
    setEditProdPrecio(String(prod.precio || 0));
    setEditProdStock(String(prod.stock || 0));
    setEditProdCategoria(prod.categoria || 'Pulseras');
    setEditProdImagen(prod.imagen || '/assets/im1.jpeg');
    setEditProdDescripcion(prod.descripcion || '');
    setEditProdActivo(Boolean(prod.activo));
    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !token) return;

    if (!editProdNombre.trim() || !editProdPrecio || isNaN(Number(editProdPrecio))) {
      setErrorMsg('El nombre y un precio numérico válido son obligatorios.');
      return;
    }

    try {
      setSavingEditProduct(true);
      setErrorMsg(null);

      const res = await fetch(`${API_BASE_URL}/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: editProdNombre.trim(),
          descripcion: editProdDescripcion.trim() || null,
          precio: Number(editProdPrecio),
          stock: Number(editProdStock) || 0,
          categoria: editProdCategoria,
          imagen: editProdImagen,
          activo: editProdActivo
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar el producto.');
      }

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data.product } : p));
      setShowEditProductModal(false);
      setSuccessMsg(`¡Producto "${editProdNombre}" actualizado con éxito!`);
      triggerProductsRefresh();
      fetchAdminData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar el producto.');
    } finally {
      setSavingEditProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el producto "${productName}" del catálogo?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setErrorMsg(null);
      const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al eliminar el producto.');
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      setSuccessMsg(`Producto "${productName}" eliminado del catálogo.`);
      triggerProductsRefresh();
      fetchAdminData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo eliminar el producto.');
    }
  };

  // Filtros
  const filteredUsers = users.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.city && u.city.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term))
    );
  });

  const filteredProducts = products.filter((p) => {
    const term = productSearchTerm.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.categoria && p.categoria.toLowerCase().includes(term)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pagado':
        return <Badge bg="success">Pagado</Badge>;
      case 'preparando':
        return <Badge bg="warning" text="dark">Preparando</Badge>;
      case 'enviado':
        return <Badge bg="info">Enviado</Badge>;
      case 'entregado':
        return <Badge bg="primary">Entregado</Badge>;
      case 'cancelado':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">Pendiente</Badge>;
    }
  };

  return (
    <>
      <Modal
        show={adminDashboardOpen}
        onHide={() => setAdminDashboardOpen(false)}
        size="xl"
        centered
        scrollable
        className="custom-admin-modal"
      >
        <Modal.Header closeButton className="admin-modal-header px-3 px-md-4 py-3 border-0">
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div className="admin-badge-icon d-flex align-items-center justify-content-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M3 20h18"></path></svg>
            </div>
            <div>
              <Modal.Title className="admin-modal-title">Panel de Administración</Modal.Title>
              <span className="text-muted small d-none d-sm-inline">
                Chunna Accesorios — Gestión integral
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="px-2 px-md-4 py-3 bg-light">
          {/* Navegación por pestañas del panel */}
          <Nav variant="pills" className="admin-nav-tabs mb-3 mb-md-4">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
                className="admin-tab-link"
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  Estadísticas
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'orders'}
                onClick={() => setActiveTab('orders')}
                className="admin-tab-link"
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17 12 22.08"></polygon><polygon points="12 1.92 21 6.92 12 12 3 6.92 12 1.92"></polygon></svg>
                  Pedidos {orders.length > 0 && <Badge bg="danger" pill className="ms-1">{orders.length}</Badge>}
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                className="admin-tab-link"
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Clientes ({users.length})
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'products'}
                onClick={() => setActiveTab('products')}
                className="admin-tab-link"
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  Catálogo ({products.length})
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'addProduct'}
                onClick={() => setActiveTab('addProduct')}
                className="admin-tab-link"
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Cargar Producto
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'bulkAi'}
                onClick={() => setActiveTab('bulkAi')}
                className="admin-tab-link"
                style={{
                  background: activeTab === 'bulkAi' ? 'linear-gradient(135deg, #7b2cbf, #9d4edd)' : undefined,
                  color: activeTab === 'bulkAi' ? '#ffffff' : undefined,
                  borderColor: activeTab === 'bulkAi' ? '#7b2cbf' : undefined
                }}
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <span>⚡ Carga Masiva IA</span>
                  {bulkQueue.length > 0 && (
                    <Badge bg={activeTab === 'bulkAi' ? 'light' : 'primary'} text={activeTab === 'bulkAi' ? 'dark' : 'white'} pill className="ms-1">
                      {bulkQueue.length}
                    </Badge>
                  )}
                </span>
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Mensajes globales */}
          {errorMsg && (
            <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="py-2 mb-3">
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert variant="success" dismissible onClose={() => setSuccessMsg(null)} className="py-2 mb-3">
              {successMsg}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-2 text-muted">Cargando datos del servidor...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ESTADÍSTICAS */}
              {activeTab === 'stats' && (
                <div>
                  <Row className="g-3 mb-4">
                    <Col lg={3} sm={6}>
                      <Card className="border-0 shadow-sm p-3 admin-stat-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Ingresos Totales</span>
                            <h3 className="mb-0 fw-bold mt-1 text-success">${stats?.totalRevenue || 0}</h3>
                          </div>
                          <div className="stat-icon bg-success-subtle text-success p-2 rounded-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col lg={3} sm={6}>
                      <Card className="border-0 shadow-sm p-3 admin-stat-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Pedidos Totales</span>
                            <h3 className="mb-0 fw-bold mt-1" style={{ color: 'var(--color-principal)' }}>{stats?.totalOrders || 0}</h3>
                          </div>
                          <div className="stat-icon p-2 rounded-circle" style={{ backgroundColor: 'rgba(117, 34, 15, 0.1)', color: 'var(--color-principal)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col lg={3} sm={6}>
                      <Card className="border-0 shadow-sm p-3 admin-stat-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Clientes Registrados</span>
                            <h3 className="mb-0 fw-bold mt-1 text-primary">{stats?.totalUsers || 0}</h3>
                          </div>
                          <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col lg={3} sm={6}>
                      <Card className="border-0 shadow-sm p-3 admin-stat-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Stock en Catálogo</span>
                            <h3 className="mb-0 fw-bold mt-1 text-warning">{stats?.totalStock || 0} u.</h3>
                          </div>
                          <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col lg={7}>
                      <Card className="border-0 shadow-sm p-3 h-100">
                        <h6 className="fw-bold mb-3" style={{ color: 'var(--color-principal)' }}>Resumen de Operaciones</h6>
                        <div className="d-flex justify-content-between border-bottom py-2">
                          <span className="text-muted">Pedidos Completados / Entregados:</span>
                          <span className="fw-bold text-success">{stats?.completedOrders || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom py-2">
                          <span className="text-muted">Pedidos Pendientes de Despacho:</span>
                          <span className="fw-bold text-danger">{stats?.pendingOrders || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom py-2">
                          <span className="text-muted">Modelos de Pulseras Activas:</span>
                          <span className="fw-bold">{stats?.totalProducts || 0} productos</span>
                        </div>
                      </Card>
                    </Col>

                    <Col lg={5}>
                      <Card className="border-0 shadow-sm p-3 h-100">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-1" style={{ color: 'var(--color-principal)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          <span>Sesión de Administración</span>
                        </h6>
                        <div className="small text-muted mb-2">
                          <strong>Cuenta activa:</strong> {user?.email}
                        </div>
                        <div className="small text-muted mb-2">
                          <strong>Base de datos:</strong> MySQL (chunna_db)
                        </div>
                        <div className="small text-muted">
                          <strong>Rol:</strong> Administrador Principal (Acceso total)
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: PEDIDOS */}
              {activeTab === 'orders' && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold" style={{ color: 'var(--color-principal)' }}>
                        Listado de Pedidos ({orders.length})
                      </h6>
                      <Button size="sm" variant="outline-secondary" className="d-inline-flex align-items-center gap-1" onClick={fetchAdminData}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        <span>Actualizar</span>
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {orders.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        No hay pedidos registrados aún en la base de datos.
                      </div>
                    ) : (
                      <>
                        {/* Vista de Tabla para Escritorio */}
                        <div className="d-none d-md-block table-responsive">
                          <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((o) => (
                                <tr key={o.id}>
                                  <td className="fw-bold">#{o.id}</td>
                                  <td>
                                    <div className="fw-semibold">{o.user_name || 'Cliente'}</div>
                                    <div className="text-muted small">{o.user_email}</div>
                                    {o.user_phone && <div className="text-muted small">{o.user_phone}</div>}
                                  </td>
                                  <td className="fw-bold text-success">${o.total}</td>
                                  <td>
                                    <Badge bg="light" text="dark" className="border d-block mb-1">{o.metodo_pago}</Badge>
                                    {o.con_envio ? (
                                      <Badge bg="info" className="d-block w-100">🚚 Con Envío</Badge>
                                    ) : (
                                      <Badge bg="secondary" className="d-block w-100">🏪 Retiro</Badge>
                                    )}
                                  </td>
                                  <td>{getStatusBadge(o.estado)}</td>
                                  <td className="small text-muted">
                                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Reciente'}
                                  </td>
                                  <td>
                                    <Form.Select
                                      size="sm"
                                      value={o.estado}
                                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                      style={{ width: '130px', fontSize: '0.8rem' }}
                                    >
                                      <option value="pendiente">Pendiente</option>
                                      <option value="pagado">Pagado</option>
                                      <option value="preparando">Preparando</option>
                                      <option value="enviado">Enviado</option>
                                      <option value="entregado">Entregado</option>
                                      <option value="cancelado">Cancelado</option>
                                    </Form.Select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>

                        {/* Vista de Tarjetas Responsivas para Móviles */}
                        <div className="d-block d-md-none p-2">
                          <div className="d-flex flex-column gap-2">
                            {orders.map((o) => (
                              <Card key={o.id} className="border p-3 rounded-3 shadow-none bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold text-dark">Pedido #{o.id}</span>
                                  <span className="fw-bold text-success fs-5">${o.total}</span>
                                </div>
                                <div className="small mb-2">
                                  <strong>Cliente:</strong> {o.user_name || 'Invitado'}{' '}
                                  <span className="text-muted">({o.user_email})</span>
                                </div>
                                <div className="d-flex gap-2 mb-2 flex-wrap">
                                  <Badge bg="light" text="dark" className="border">{o.metodo_pago}</Badge>
                                  {o.con_envio ? <Badge bg="info">🚚 Con Envío</Badge> : <Badge bg="secondary">🏪 Retiro</Badge>}
                                  {getStatusBadge(o.estado)}
                                </div>
                                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                                  <span className="text-muted small">
                                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Reciente'}
                                  </span>
                                  <Form.Select
                                    size="sm"
                                    value={o.estado}
                                    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                    style={{ width: '135px', fontSize: '0.85rem' }}
                                  >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="pagado">Pagado</option>
                                    <option value="preparando">Preparando</option>
                                    <option value="enviado">Enviado</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                  </Form.Select>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* TAB 3: CLIENTES / COMPRADORES */}
              {activeTab === 'users' && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3">
                    <Row className="g-2 align-items-center">
                      <Col md={6}>
                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--color-principal)' }}>
                          Gestión de Clientes ({filteredUsers.length})
                        </h6>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="search"
                          placeholder="Buscar por nombre, email o ciudad..."
                          size="sm"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        No se encontraron clientes registrados con ese criterio.
                      </div>
                    ) : (
                      <>
                        {/* Vista de Tabla para Escritorio */}
                        <div className="d-none d-md-block table-responsive">
                          <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Nombre</th>
                                <th>Contacto</th>
                                <th>Ubicación / Dirección</th>
                                <th>Notas</th>
                                <th>Rol</th>
                                <th>Registro</th>
                                <th className="text-end">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map((u) => (
                                <tr key={u.id}>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="navbar-user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                                        {u.name?.charAt(0).toUpperCase()}
                                      </span>
                                      <div>
                                        <div className="fw-bold">{u.name}</div>
                                        <div className="text-muted small">{u.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {u.phone ? (
                                      <a
                                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-success btn-sm py-0 px-2 small d-inline-flex align-items-center gap-1"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        <span>{u.phone}</span>
                                      </a>
                                    ) : (
                                      <span className="text-muted small">Sin teléfono</span>
                                    )}
                                  </td>
                                  <td>
                                    <div className="small">{u.address || 'Sin dirección'}</div>
                                    {u.city && <Badge bg="secondary" className="small">{u.city}</Badge>}
                                  </td>
                                  <td>
                                    <span className="small text-muted">
                                      {u.notes || '—'}
                                    </span>
                                  </td>
                                  <td>
                                    <Badge bg={u.role === 'admin' ? 'danger' : 'primary'}>
                                      {u.role?.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="small text-muted">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Reciente'}
                                  </td>
                                  <td className="text-end">
                                    <div className="d-inline-flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        className="d-inline-flex align-items-center gap-1 py-1 px-2"
                                        onClick={() => handleOpenEditUser(u)}
                                        title="Editar datos del cliente"
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        <span>Editar</span>
                                      </Button>
                                      {u.role !== 'admin' && u.email !== 'cunna.accs@gmail.com' && (
                                        <Button
                                          size="sm"
                                          variant="outline-danger"
                                          className="d-inline-flex align-items-center gap-1 py-1 px-2"
                                          onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                                          title="Eliminar cuenta del cliente"
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                          <span>Eliminar</span>
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>

                        {/* Vista de Tarjetas Responsivas para Móviles */}
                        <div className="d-block d-md-none p-2">
                          <div className="d-flex flex-column gap-2">
                            {filteredUsers.map((u) => (
                              <Card key={u.id} className="border p-3 rounded-3 shadow-none bg-white">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="navbar-user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                                      {u.name?.charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                      <div className="fw-bold">{u.name}</div>
                                      <div className="text-muted small">{u.email}</div>
                                    </div>
                                  </div>
                                  <Badge bg={u.role === 'admin' ? 'danger' : 'primary'}>
                                    {u.role?.toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="small mb-2 text-muted">
                                  {u.city && <span className="me-2">📍 {u.city}</span>}
                                  {u.address && <span>🏠 {u.address}</span>}
                                </div>

                                {u.notes && (
                                  <div className="small bg-light p-2 rounded mb-2 text-muted fst-italic">
                                    "{u.notes}"
                                  </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
                                  <div>
                                    {u.phone && (
                                      <a
                                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-success btn-sm py-1 px-2 small d-inline-flex align-items-center gap-1"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        <span>WhatsApp</span>
                                      </a>
                                    )}
                                  </div>

                                  <div className="d-flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="py-1 px-2"
                                    >
                                      Editar
                                    </Button>
                                    {u.role !== 'admin' && u.email !== 'cunna.accs@gmail.com' && (
                                      <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                                        className="py-1 px-2"
                                      >
                                        Eliminar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* TAB 4: CATÁLOGO DE PRODUCTOS (LISTADO, EDICIÓN Y ELIMINACIÓN) */}
              {activeTab === 'products' && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3">
                    <Row className="g-2 align-items-center">
                      <Col xs={12} md={4}>
                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--color-principal)' }}>
                          Catálogo de Productos ({filteredProducts.length})
                        </h6>
                      </Col>
                      <Col xs={7} md={5}>
                        <Form.Control
                          type="search"
                          placeholder="Buscar producto o categoría..."
                          size="sm"
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                      </Col>
                      <Col xs={5} md={3} className="text-end">
                        <Button
                          size="sm"
                          className="btn-custom-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
                          onClick={() => setActiveTab('addProduct')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          <span>+ Nuevo</span>
                        </Button>
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        No se encontraron productos con ese criterio de búsqueda.
                      </div>
                    ) : (
                      <>
                        {/* Vista de Tabla para Escritorio */}
                        <div className="d-none d-md-block table-responsive">
                          <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '60px' }}>Foto</th>
                                <th>Nombre y Descripción</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProducts.map((p) => (
                                <tr key={p.id}>
                                  <td>
                                    <img
                                      src={getImageUrl(p.imagen)}
                                      alt={p.nombre}
                                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }}
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/im1.jpeg'; }}
                                    />
                                  </td>
                                  <td>
                                    <div className="fw-bold">{p.nombre}</div>
                                    <div className="text-muted small text-truncate" style={{ maxWidth: '280px' }}>
                                      {p.descripcion || 'Sin descripción'}
                                    </div>
                                  </td>
                                  <td>
                                    <Badge bg="light" text="dark" className="border">
                                      {p.categoria || 'Pulseras'}
                                    </Badge>
                                  </td>
                                  <td className="fw-bold text-success">${p.precio}</td>
                                  <td>
                                    <Badge bg={p.stock <= 0 ? 'danger' : p.stock < 5 ? 'warning' : 'secondary'}>
                                      {p.stock} unid.
                                    </Badge>
                                  </td>
                                  <td>
                                    {Boolean(p.activo) ? (
                                      <Badge bg="success">Activo</Badge>
                                    ) : (
                                      <Badge bg="secondary">Inactivo</Badge>
                                    )}
                                  </td>
                                  <td className="text-end">
                                    <div className="d-inline-flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        className="d-inline-flex align-items-center gap-1 py-1 px-2"
                                        onClick={() => handleOpenEditProduct(p)}
                                        title="Modificar producto"
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        <span>Modificar</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-danger"
                                        className="d-inline-flex align-items-center gap-1 py-1 px-2"
                                        onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                        title="Eliminar producto"
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        <span>Eliminar</span>
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>

                        {/* Vista de Tarjetas Responsivas para Móviles (Sin scroll horizontal) */}
                        <div className="d-block d-md-none p-2">
                          <div className="d-flex flex-column gap-3">
                            {filteredProducts.map((p) => (
                              <Card key={p.id} className="border p-3 rounded-3 shadow-none bg-white">
                                <div className="d-flex gap-3 align-items-start mb-2">
                                  <img
                                    src={getImageUrl(p.imagen)}
                                    alt={p.nombre}
                                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px' }}
                                    className="flex-shrink-0 border"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/im1.jpeg'; }}
                                  />
                                  <div className="flex-grow-1 min-w-0">
                                    <div className="fw-bold fs-6 mb-1 text-dark text-truncate">{p.nombre}</div>
                                    <div className="d-flex gap-1 flex-wrap mb-1">
                                      <Badge bg="light" text="dark" className="border">{p.categoria || 'Pulseras'}</Badge>
                                      {Boolean(p.activo) ? (
                                        <Badge bg="success">Activo</Badge>
                                      ) : (
                                        <Badge bg="secondary">Inactivo</Badge>
                                      )}
                                      <Badge bg={p.stock <= 0 ? 'danger' : p.stock < 5 ? 'warning' : 'info'} text={p.stock < 5 ? 'dark' : 'white'}>
                                        Stock: {p.stock}
                                      </Badge>
                                    </div>
                                    <div className="fw-bold text-success fs-5">${p.precio}</div>
                                  </div>
                                </div>

                                {p.descripcion && (
                                  <div className="small text-muted mb-3 line-clamp-2">
                                    {p.descripcion}
                                  </div>
                                )}

                                <div className="d-flex gap-2 pt-2 border-top">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-1"
                                    onClick={() => handleOpenEditProduct(p)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    <span>Modificar</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-1"
                                    onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    <span>Eliminar</span>
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* TAB 5: CARGAR PRODUCTO INDIVIDUAL */}
              {activeTab === 'addProduct' && (
                <Row className="g-3 g-md-4">
                  <Col lg={7}>
                    <Card className="border-0 shadow-sm p-3 p-md-4 bg-white rounded-3">
                      <h6 className="fw-bold mb-3" style={{ color: 'var(--color-principal)' }}>Información del Producto</h6>
                      <Form onSubmit={handleCreateProduct}>
                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">Nombre del Producto</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Pulsera Macramé Ojo de Tigre"
                            value={prodNombre}
                            onChange={(e) => setProdNombre(e.target.value)}
                            className="form-control-custom"
                            required
                          />
                        </Form.Group>

                        <Row className="g-3 mb-3">
                          <Col md={6}>
                            <Form.Label className="auth-label">Precio ($ ARS)</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Ej: 1800"
                              value={prodPrecio}
                              onChange={(e) => setProdPrecio(e.target.value)}
                              className="form-control-custom"
                              required
                            />
                          </Col>
                          <Col md={6}>
                            <Form.Label className="auth-label">Stock Disponible</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Ej: 15"
                              value={prodStock}
                              onChange={(e) => setProdStock(e.target.value)}
                              className="form-control-custom"
                              required
                            />
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">Categoría</Form.Label>
                          <Form.Select
                            value={prodCategoria}
                            onChange={(e) => setProdCategoria(e.target.value)}
                            className="form-control-custom"
                          >
                            <option value="Pulseras">Pulseras</option>
                            <option value="Collares">Collares</option>
                            <option value="Aros">Aros</option>
                            <option value="Tobilleras">Tobilleras</option>
                            <option value="Anillos">Anillos</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">Descripción</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe los materiales, el tejido, color y detalles especiales..."
                            value={prodDescripcion}
                            onChange={(e) => setProdDescripcion(e.target.value)}
                            className="form-control-custom"
                          />
                        </Form.Group>

                        <div className="text-end mt-4">
                          <Button
                            type="submit"
                            className="btn-custom-primary w-100 w-md-auto px-4 py-2"
                            disabled={savingProduct}
                          >
                            {savingProduct ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Guardando Producto...
                              </>
                            ) : (
                              'Guardar en Catálogo'
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card>
                  </Col>

                  <Col lg={5}>
                    <Card className="border-0 shadow-sm p-3 p-md-4 bg-white rounded-3 h-100">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--color-principal)' }}>Fotografía del Producto</h6>
                        {imageFile && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="py-0 px-2 small"
                          >
                            Quitar
                          </Button>
                        )}
                      </div>

                      {/* Drag & Drop Area */}
                      <div
                        className={`dropzone-area text-center p-3 mb-3 rounded-3 position-relative ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={handleDropzoneClick}
                        style={{
                          border: '2px dashed #d97757',
                          backgroundColor: dragActive ? 'rgba(217, 119, 87, 0.1)' : '#fdfaf8',
                          cursor: 'pointer',
                          minHeight: '130px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />

                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97757" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <p className="small mb-1 fw-semibold text-dark">
                          Toca o arrastra una foto aquí
                        </p>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Formatos: JPG, PNG, WEBP (hasta 10MB)
                        </span>
                      </div>

                      {/* Botón de Autocompletar con IA */}
                      {imageFile && (
                        <div className="mb-3">
                          <Button
                            variant="primary"
                            className="w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                            style={{
                              background: 'linear-gradient(135deg, #7b2cbf 0%, #9d4edd 100%)',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(123, 44, 191, 0.25)'
                            }}
                            disabled={analyzingSingleAI}
                            onClick={handleAutofillWithAI}
                          >
                            {analyzingSingleAI ? (
                              <>
                                <Spinner animation="border" size="sm" variant="light" />
                                <span>Analizando con Gemini...</span>
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                <span className="fw-semibold">⚡ Autocompletar con IA</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Vista previa */}
                      <div className="text-center mt-auto">
                        <span className="text-muted small d-block mb-2">Vista previa:</span>
                        <img
                          src={getImageUrl(prodImagen)}
                          alt="Preview"
                          className="img-fluid rounded-3 shadow-sm"
                          style={{ maxHeight: '140px', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/im1.jpeg'; }}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* TAB 6: CARGA MASIVA CON IA */}
              {activeTab === 'bulkAi' && (
                <div>
                  {/* Zona Dropzone Masivo */}
                  <div
                    className={`bulk-dropzone text-center p-3 p-md-4 mb-3 mb-md-4 rounded-4 bg-white shadow-sm position-relative ${bulkDragActive ? 'active' : ''}`}
                    onDragEnter={handleBulkDrag}
                    onDragLeave={handleBulkDrag}
                    onDragOver={handleBulkDrag}
                    onDrop={handleBulkDrop}
                    onClick={() => bulkFileInputRef.current?.click()}
                    style={{
                      border: '2.5px dashed #9d4edd',
                      backgroundColor: bulkDragActive ? 'rgba(157, 78, 221, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBulkFileChange}
                      style={{ display: 'none' }}
                    />

                    <div className="py-2 py-md-3">
                      <div className="mb-2">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7b2cbf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <h5 className="fw-bold mb-1 fs-6 fs-md-5" style={{ color: '#4a154b' }}>
                        Selecciona o arrastra múltiples fotos aquí
                      </h5>
                      <p className="text-muted small mb-0">
                        La Inteligencia Artificial analizará cada foto en paralelo para sugerir títulos, categorías y precios.
                      </p>
                    </div>
                  </div>

                  {/* Barra de Acciones de Cola Masiva */}
                  {bulkQueue.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-3 shadow-sm flex-wrap gap-2">
                      <div>
                        <span className="fw-bold text-dark me-2">En cola:</span>
                        <Badge bg="primary" pill className="fs-6">{bulkQueue.length}</Badge>
                      </div>

                      <div className="d-flex gap-2 w-100 w-sm-auto justify-content-end">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleClearBulkQueue}
                          disabled={savingBulk}
                        >
                          Limpiar
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          className="px-3 fw-semibold"
                          style={{ background: 'linear-gradient(135deg, #7b2cbf, #9d4edd)', border: 'none' }}
                          onClick={handleSaveBulkProducts}
                          disabled={savingBulk || bulkQueue.some(i => i.status === 'analyzing')}
                        >
                          {savingBulk ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Guardando...
                            </>
                          ) : (
                            `💾 Guardar ${bulkQueue.length} productos`
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Grilla de Productos en Cola */}
                  {bulkQueue.length > 0 ? (
                    <div className="bulk-queue-grid">
                      <Row className="g-3">
                        {bulkQueue.map((item) => (
                          <Col lg={4} md={6} key={item.id}>
                            <Card className="border-0 shadow-sm p-3 h-100 bg-white rounded-3 position-relative">
                              <div className="mb-2 d-flex justify-content-between align-items-center">
                                <Badge bg={
                                  item.status === 'done' ? 'success' :
                                  item.status === 'analyzing' ? 'warning' :
                                  item.status === 'error' ? 'danger' : 'secondary'
                                }>
                                  {item.status === 'done' && '✓ Analizado con IA'}
                                  {item.status === 'analyzing' && '⏳ Analizando...'}
                                  {item.status === 'error' && '⚠️ Error IA'}
                                  {item.status === 'pending' && 'En espera'}
                                </Badge>
                              </div>

                              <div className="text-center mb-2">
                                <img
                                  src={item.previewUrl}
                                  alt={item.nombre}
                                  className="img-fluid rounded-3"
                                  style={{ height: '140px', width: '100%', objectFit: 'cover' }}
                                />
                              </div>

                              <Form.Group className="mb-2">
                                <Form.Label className="auth-label small mb-1">Nombre / Título</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  value={item.nombre}
                                  onChange={(e) => handleBulkItemChange(item.id, 'nombre', e.target.value)}
                                  placeholder="Nombre de la pulsera"
                                />
                              </Form.Group>

                              <Row className="g-2 mb-2">
                                <Col xs={6}>
                                  <Form.Label className="auth-label small mb-1">Categoría</Form.Label>
                                  <Form.Select
                                    size="sm"
                                    value={item.categoria}
                                    onChange={(e) => handleBulkItemChange(item.id, 'categoria', e.target.value)}
                                  >
                                    <option value="Pulseras">Pulseras</option>
                                    <option value="Collares">Collares</option>
                                    <option value="Aros">Aros</option>
                                    <option value="Tobilleras">Tobilleras</option>
                                    <option value="Anillos">Anillos</option>
                                  </Form.Select>
                                </Col>
                                <Col xs={3}>
                                  <Form.Label className="auth-label small mb-1">Precio ($)</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    value={item.precio}
                                    onChange={(e) => handleBulkItemChange(item.id, 'precio', e.target.value)}
                                  />
                                </Col>
                                <Col xs={3}>
                                  <Form.Label className="auth-label small mb-1">Stock</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    value={item.stock}
                                    onChange={(e) => handleBulkItemChange(item.id, 'stock', e.target.value)}
                                  />
                                </Col>
                              </Row>

                              <Form.Group className="mb-3">
                                <Form.Label className="auth-label small mb-1">Descripción</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  size="sm"
                                  value={item.descripcion}
                                  onChange={(e) => handleBulkItemChange(item.id, 'descripcion', e.target.value)}
                                  placeholder="Detalle y materiales..."
                                />
                              </Form.Group>

                              <div className="d-flex justify-content-end mt-auto">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => handleRemoveBulkItem(item.id)}
                                >
                                  Quitar de la cola
                                </Button>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ) : (
                    <Card className="border-0 shadow-sm p-4 text-center bg-white rounded-3">
                      <div className="py-3">
                        <div className="mb-3 text-muted">
                          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9d4edd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">No hay productos en la cola masiva</h6>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '480px' }}>
                          Toca o arrastra varias fotos de tu catálogo arriba para ver la IA de Gemini analizando cada accesorio automáticamente.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL PARA MODIFICAR / EDITAR PRODUCTO EXISTENTE */}
      {/* ========================================================================= */}
      <Modal
        show={showEditProductModal}
        onHide={() => setShowEditProductModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--color-principal)' }}>
            ✏️ Modificar Producto
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveEditProduct}>
          <Modal.Body className="pt-3">
            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Nombre del Producto</Form.Label>
              <Form.Control
                type="text"
                value={editProdNombre}
                onChange={(e) => setEditProdNombre(e.target.value)}
                className="form-control-custom"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label className="auth-label">Precio ($ ARS)</Form.Label>
                <Form.Control
                  type="number"
                  value={editProdPrecio}
                  onChange={(e) => setEditProdPrecio(e.target.value)}
                  className="form-control-custom"
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label className="auth-label">Stock</Form.Label>
                <Form.Control
                  type="number"
                  value={editProdStock}
                  onChange={(e) => setEditProdStock(e.target.value)}
                  className="form-control-custom"
                  required
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Categoría</Form.Label>
              <Form.Select
                value={editProdCategoria}
                onChange={(e) => setEditProdCategoria(e.target.value)}
                className="form-control-custom"
              >
                <option value="Pulseras">Pulseras</option>
                <option value="Collares">Collares</option>
                <option value="Aros">Aros</option>
                <option value="Tobilleras">Tobilleras</option>
                <option value="Anillos">Anillos</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">URL de la Imagen</Form.Label>
              <Form.Control
                type="text"
                value={editProdImagen}
                onChange={(e) => setEditProdImagen(e.target.value)}
                className="form-control-custom"
                placeholder="/assets/im1.jpeg o URL externa"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editProdDescripcion}
                onChange={(e) => setEditProdDescripcion(e.target.value)}
                className="form-control-custom"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="switch"
                id="edit-product-active-switch"
                label="Producto Activo (Visible para compra en la tienda)"
                checked={editProdActivo}
                onChange={(e) => setEditProdActivo(e.target.checked)}
                className="fw-semibold"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditProductModal(false)}
              disabled={savingEditProduct}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-custom-primary px-4"
              disabled={savingEditProduct}
            >
              {savingEditProduct ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Guardando Cambios...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL PARA EDITAR CLIENTE */}
      {/* ========================================================================= */}
      <Modal
        show={showEditUserModal}
        onHide={() => setShowEditUserModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--color-principal)' }}>
            ✏️ Editar Datos del Cliente
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveEditUser}>
          <Modal.Body className="pt-3">
            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Nombre Completo</Form.Label>
              <Form.Control
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="form-control-custom"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                className="form-control-custom"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label className="auth-label">Teléfono / WhatsApp</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+54 9 11 ..."
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="form-control-custom"
                />
              </Col>
              <Col md={6}>
                <Form.Label className="auth-label">Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: Córdoba"
                  value={editUserCity}
                  onChange={(e) => setEditUserCity(e.target.value)}
                  className="form-control-custom"
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Dirección de Entrega</Form.Label>
              <Form.Control
                type="text"
                placeholder="Calle, número, piso..."
                value={editUserAddress}
                onChange={(e) => setEditUserAddress(e.target.value)}
                className="form-control-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-label">Notas de Comprador</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Preferencias, detalles de entrega, etc."
                value={editUserNotes}
                onChange={(e) => setEditUserNotes(e.target.value)}
                className="form-control-custom"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditUserModal(false)}
              disabled={savingUser}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-custom-primary px-4"
              disabled={savingUser}
            >
              {savingUser ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Guardando Cambios...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default AdminDashboardModal;
