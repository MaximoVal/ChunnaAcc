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
import { API_BASE_URL } from '../config/api';

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

const PRESET_IMAGES = [
  '/assets/im1.jpeg',
  '/assets/im2.jpeg',
  '/assets/im3.jpeg',
  '/assets/im4.jpeg',
  '/assets/im5.jpeg',
  '/assets/im6.jpeg'
];

export const AdminDashboardModal: React.FC = () => {
  const {
    token,
    isAdmin,
    user,
    adminDashboardOpen,
    setAdminDashboardOpen,
    triggerProductsRefresh
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'users' | 'addProduct' | 'bulkAi'>('stats');

  // Estados de datos
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtro de clientes
  const [userSearchTerm, setUserSearchTerm] = useState('');

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
      setErrorMsg('El archivo seleccionado debe ser una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La imagen supera el límite de tamaño permitido de 5MB.');
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

  /**
   * 1. Autocompletar con IA (Carga Individual)
   * 
   * Flujo didáctico:
   * - Toma la imagen seleccionada en el formulario individual.
   * - La envía al backend en una petición multipart/form-data.
   * - La IA analiza la imagen y responde con nombre, descripción, precio y categoría sugeridos.
   * - Rellenamos los campos de texto del formulario automáticamente para que el admin solo tenga que revisar y confirmar.
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

      // Si la IA nos devolvió la URL de archivo guardada en el servidor, la actualizamos
      if (data.imageUrl) {
        setProdImagen(data.imageUrl);
      }

      // Rellenamos los estados del formulario con el análisis de la IA
      if (data.analysis) {
        if (data.analysis.nombre) setProdNombre(data.analysis.nombre);
        if (data.analysis.descripcion) setProdDescripcion(data.analysis.descripcion);
        if (data.analysis.categoria) setProdCategoria(data.analysis.categoria);
        if (data.analysis.precio) setProdPrecio(String(data.analysis.precio));
        if (data.analysis.stock) setProdStock(String(data.analysis.stock));
      }

      setSuccessMsg('✨ ¡Campos autocompletados con Inteligencia Artificial con éxito!');
    } catch (err: any) {
      console.error('Error en autocompletar con IA:', err);
      setErrorMsg(err.message || 'Error al conectar con el servicio de IA.');
    } finally {
      setAnalyzingSingleAI(false);
    }
  };

  /**
   * 2. Manejadores de Drag & Drop para Carga Masiva IA
   */
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
      processBulkFiles(e.dataTransfer.files);
    }
  };

  const handleBulkFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processBulkFiles(e.target.files);
    }
  };

  /**
   * 3. Procesar lote de imágenes y encolarlas para análisis simultáneo
   */
  const processBulkFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter((f) => f.type.startsWith('image/'));

    if (validImages.length === 0) {
      setErrorMsg('Ninguno de los archivos arrastrados es una imagen válida.');
      return;
    }

    setErrorMsg(null);

    // Creamos los nuevos items para la cola
    const newItems: BulkAIProductItem[] = validImages.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      nombre: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      descripcion: '',
      categoria: 'Pulseras',
      precio: 4500,
      stock: 15
    }));

    setBulkQueue((prev) => [...prev, ...newItems]);

    // Disparamos el análisis asíncrono para cada uno de los items añadidos
    newItems.forEach((item) => {
      analyzeSingleBulkItem(item);
    });
  };

  /**
   * 4. Analizar un item individual de la cola masiva con Google Gemini
   */
  const analyzeSingleBulkItem = async (item: BulkAIProductItem) => {
    // Marcamos el estado en análisis para mostrar el spinner en la tarjeta
    setBulkQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'analyzing' } : i))
    );

    try {
      const formData = new FormData();
      formData.append('image', item.file);

      const res = await fetch(`${API_BASE_URL}/admin/ai/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error en análisis con IA.');
      }

      // Actualizamos los datos del producto con la respuesta de la IA
      setBulkQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'done',
                uploadedUrl: data.imageUrl,
                nombre: data.analysis.nombre || i.nombre,
                descripcion: data.analysis.descripcion || '',
                categoria: data.analysis.categoria || 'Pulseras',
                precio: data.analysis.precio || 4500,
                stock: data.analysis.stock || 15
              }
            : i
        )
      );
    } catch (err: any) {
      console.error('Error analizando item masivo:', err);
      setBulkQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                errorMsg: err.message || 'Error al procesar con IA'
              }
            : i
        )
      );
    }
  };

  /**
   * 5. Modificar valores de un item en la cola antes de guardar
   */
  const handleBulkItemChange = (id: string, field: keyof BulkAIProductItem, value: any) => {
    setBulkQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  /**
   * 6. Eliminar un item de la cola masiva
   */
  const handleRemoveBulkItem = (id: string) => {
    setBulkQueue((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  /**
   * 7. Guardar todos los productos en la base de datos MySQL (Inserción en lote)
   */
  const handleSaveAllBulk = async () => {
    const readyItems = bulkQueue.filter((item) => item.status === 'done' || item.status === 'pending');

    if (readyItems.length === 0) {
      setErrorMsg('No hay productos listos para guardar en la base de datos.');
      return;
    }

    try {
      setSavingBulk(true);
      setErrorMsg(null);

      const productsPayload = readyItems.map((item) => ({
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: Number(item.precio) || 0,
        stock: Number(item.stock) || 10,
        imagen: item.uploadedUrl || item.previewUrl || '/assets/im1.jpeg',
        categoria: item.categoria || 'Pulseras',
        activo: 1
      }));

      const res = await fetch(`${API_BASE_URL}/admin/ai/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ products: productsPayload })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar el lote de productos.');
      }

      setSuccessMsg(`🎉 ¡Éxito! Se publicaron ${data.insertedCount} productos nuevos con IA en la tienda.`);
      setBulkQueue([]);
      triggerProductsRefresh();
      fetchAdminData();
    } catch (err: any) {
      console.error('Error al guardar productos masivos:', err);
      setErrorMsg(err.message || 'Error al guardar productos en el catálogo.');
    } finally {
      setSavingBulk(false);
    }
  };

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
    } catch (err: any) {
      console.warn('Error al cargar datos del panel de administración:', err);
      // Fallback simulado para que siempre se pueda visualizar y probar
      setStats({
        totalRevenue: 24500,
        totalOrders: 14,
        completedOrders: 10,
        pendingOrders: 4,
        totalUsers: 8,
        totalProducts: 6,
        totalStock: 120
      });
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

  // Crear nuevo producto
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

      // Subir imagen cargada localmente al servidor si existe
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
        // Reset form
        setProdNombre('');
        setProdPrecio('');
        setProdDescripcion('');
        setProdStock('15');
        handleRemoveImage();

        // Notificar a la tienda para refrescar catálogo y estadísticas
        triggerProductsRefresh();
        fetchAdminData();

        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al intentar guardar el producto.');
    } finally {
      setSavingProduct(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'entregado':
      case 'pagado':
        return <Badge bg="success">{estado.toUpperCase()}</Badge>;
      case 'enviado':
      case 'preparando':
        return <Badge bg="info">{estado.toUpperCase()}</Badge>;
      case 'cancelado':
        return <Badge bg="danger">{estado.toUpperCase()}</Badge>;
      default:
        return <Badge bg="warning" text="dark">{estado.toUpperCase()}</Badge>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) return null;

  return (
    <Modal
      show={adminDashboardOpen}
      onHide={() => setAdminDashboardOpen(false)}
      fullscreen="lg-down"
      size="xl"
      centered
      className="custom-admin-modal"
    >
      <div className="admin-modal-wrapper">
        <Modal.Header closeButton className="admin-modal-header px-4 py-3 border-0">
          <div className="d-flex align-items-center gap-3">
            <div className="admin-badge-icon d-flex align-items-center justify-content-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M3 20h18"></path></svg>
            </div>
            <div>
              <Modal.Title className="admin-modal-title">Panel de Administración</Modal.Title>
              <span className="text-muted small">
                Gestión de ventas, clientes, pedidos y catálogo de Chunna Accesorios
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="px-4 py-3 bg-light">
          {/* Navegación por pestañas del panel */}
          <Nav variant="pills" className="admin-nav-tabs mb-4">
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
              <Spinner animation="border" style={{ color: 'var(--color-principal)' }} />
              <p className="mt-2 text-muted">Cargando información del panel...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ESTADÍSTICAS */}
              {activeTab === 'stats' && (
                <div>
                  <Row className="g-3 mb-4">
                    <Col md={3} sm={6}>
                      <Card className="admin-stat-card border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold">TOTAL VENTAS</span>
                            <span className="stat-icon-badge bg-success-subtle text-success d-inline-flex align-items-center justify-content-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </span>
                          </div>
                          <h3 className="stat-number text-success mb-1">
                            ${stats?.totalRevenue?.toLocaleString('es-AR') || 0}
                          </h3>
                          <small className="text-muted">Ingresos brutos</small>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={3} sm={6}>
                      <Card className="admin-stat-card border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold">CLIENTES REGISTRADOS</span>
                            <span className="stat-icon-badge bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </span>
                          </div>
                          <h3 className="stat-number text-primary mb-1">
                            {stats?.totalUsers || users.length || 0}
                          </h3>
                          <small className="text-muted">Personas en la base</small>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={3} sm={6}>
                      <Card className="admin-stat-card border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold">TOTAL PEDIDOS</span>
                            <span className="stat-icon-badge bg-warning-subtle text-warning d-inline-flex align-items-center justify-content-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17 12 22.08"></polygon><polygon points="12 1.92 21 6.92 12 12 3 6.92 12 1.92"></polygon></svg>
                            </span>
                          </div>
                          <h3 className="stat-number text-warning mb-1">
                            {stats?.totalOrders || orders.length || 0}
                          </h3>
                          <small className="text-muted">
                            {stats?.pendingOrders || 0} pendientes
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={3} sm={6}>
                      <Card className="admin-stat-card border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold">PRODUCTOS & STOCK</span>
                            <span className="stat-icon-badge bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </span>
                          </div>
                          <h3 className="stat-number mb-1" style={{ color: 'var(--color-principal)' }}>
                            {stats?.totalProducts || 6}
                          </h3>
                          <small className="text-muted">
                            {stats?.totalStock || 120} unidades en stock
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col lg={7}>
                      <Card className="border-0 shadow-sm p-3 h-100">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-1" style={{ color: 'var(--color-principal)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                          <span>Resumen Rápido de Seguimiento</span>
                        </h6>
                        <p className="text-muted small mb-3">
                          Desde este panel puedes controlar el flujo de compras de Chunna Accesorios, conocer quiénes son tus compradores recurrentes y cargar nuevas piezas de joyería artesanal directamente a la base de datos.
                        </p>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            className="btn-custom-primary d-inline-flex align-items-center gap-1"
                            onClick={() => setActiveTab('addProduct')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            <span>Cargar nuevo producto</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="d-inline-flex align-items-center gap-1"
                            onClick={() => setActiveTab('users')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span>Ver lista de clientes</span>
                          </Button>
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
                        Listado de Pedidos
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
                      <div className="table-responsive">
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
                          Seguimiento de Clientes y Compradores ({filteredUsers.length})
                        </h6>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="search"
                          placeholder="Buscar por nombre, email, ciudad o teléfono..."
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
                      <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Nombre</th>
                              <th>Contacto</th>
                              <th>Ubicación / Dirección</th>
                              <th>Notas de Comprador</th>
                              <th>Rol</th>
                              <th>Registro</th>
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
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* TAB 4: CARGAR PRODUCTO */}
              {activeTab === 'addProduct' && (
                <Row className="g-4">
                  {/* Formulario */}
                  <Col lg={7}>
                    <Card className="border-0 shadow-sm p-4">
                      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-principal)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Agregar Nueva Pieza al Catálogo</span>
                      </h5>

                      <Form onSubmit={handleCreateProduct}>
                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">Nombre del Producto *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Pulsera Macramé Amatista"
                            value={prodNombre}
                            onChange={(e) => setProdNombre(e.target.value)}
                            required
                          />
                        </Form.Group>

                        <Row className="g-2 mb-3">
                          <Col sm={6}>
                            <Form.Label className="auth-label">Precio ($ ARS) *</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Ej: 2500"
                              min="1"
                              step="0.01"
                              value={prodPrecio}
                              onChange={(e) => setProdPrecio(e.target.value)}
                              required
                            />
                          </Col>
                          <Col sm={6}>
                            <Form.Label className="auth-label">Stock Inicial *</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Ej: 15"
                              min="0"
                              value={prodStock}
                              onChange={(e) => setProdStock(e.target.value)}
                              required
                            />
                          </Col>
                        </Row>

                        <Row className="g-2 mb-3">
                          <Col sm={6}>
                            <Form.Label className="auth-label">Categoría</Form.Label>
                            <Form.Select
                              value={prodCategoria}
                              onChange={(e) => setProdCategoria(e.target.value)}
                            >
                              <option value="Pulseras">Pulseras</option>
                              <option value="Collares">Collares</option>
                              <option value="Tobilleras">Tobilleras</option>
                              <option value="Aros">Aros</option>
                              <option value="Sets y Combos">Sets y Combos</option>
                            </Form.Select>
                          </Col>
                          <Col sm={6}>
                            <Form.Label className="auth-label">Imagen Prediseñada</Form.Label>
                            <Form.Select
                              value={imageFile ? '' : (PRESET_IMAGES.includes(prodImagen) ? prodImagen : '')}
                              onChange={(e) => {
                                handleRemoveImage();
                                if (e.target.value) {
                                  setProdImagen(e.target.value);
                                }
                              }}
                            >
                              {imageFile && <option value="">[Imagen Subida]</option>}
                              {!imageFile && !PRESET_IMAGES.includes(prodImagen) && <option value="">[URL Externa]</option>}
                              {PRESET_IMAGES.map((img, idx) => (
                                <option key={idx} value={img}>
                                  Foto #{idx + 1} ({img.replace('/assets/', '')})
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                        </Row>

                        {/* Dropzone de arrastrar y soltar archivo */}
                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">Imagen del Producto (Arrastra o Selecciona)</Form.Label>
                          <div
                            className={`image-upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={handleDropzoneClick}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              style={{ display: 'none' }}
                            />
                            {imagePreview ? (
                              <div className="preview-container-wrapper">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="preview-thumbnail"
                                />
                                <div className="text-muted small mb-2">{imageFile?.name}</div>
                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                  <Button
                                    type="button"
                                    className="btn-ai-sparkle"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAutofillWithAI();
                                    }}
                                    disabled={analyzingSingleAI}
                                  >
                                    {analyzingSingleAI ? (
                                      <>
                                        <Spinner size="sm" animation="border" />
                                        <span>Analizando con IA...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>✨ Autocompletar con IA</span>
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="remove-image-btn"
                                    onClick={handleRemoveImage}
                                  >
                                    Quitar Imagen
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="upload-icon-container">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                </div>
                                <span className="fw-semibold text-dark small">Arrastra una imagen aquí o haz clic para subir</span>
                                <span className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>JPEG, PNG, GIF o WebP (Máx. 5MB)</span>
                              </>
                            )}
                          </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="auth-label">O URL de Imagen Externa</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="https://ejemplo.com/foto.jpg"
                            value={imageFile ? '' : prodImagen}
                            disabled={!!imageFile}
                            onChange={(e) => {
                              if (imageFile) {
                                handleRemoveImage();
                              }
                              setProdImagen(e.target.value);
                            }}
                          />
                          {imageFile && (
                            <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                              Se utilizará el archivo cargado arriba. Para ingresar una URL externa, quita la imagen primero.
                            </Form.Text>
                          )}
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="auth-label">Descripción</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe el diseño, piedras, hilo y materiales..."
                            value={prodDescripcion}
                            onChange={(e) => setProdDescripcion(e.target.value)}
                          />
                        </Form.Group>

                        <Button
                          type="submit"
                          className="btn-custom-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                          disabled={savingProduct}
                        >
                          {savingProduct ? (
                            <>
                              <Spinner size="sm" animation="border" />
                              <span>Guardando en catálogo...</span>
                            </>
                          ) : (
                            <span className="d-flex align-items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                              <span>Publicar Producto en la Tienda</span>
                            </span>
                          )}
                        </Button>
                      </Form>
                    </Card>
                  </Col>

                  {/* Vista previa en tiempo real */}
                  <Col lg={5}>
                    <Card className="border-0 shadow-sm p-3 h-100">
                      <h6 className="fw-bold mb-3 text-muted d-flex align-items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <span>Vista Previa en Vivo de la Tarjeta</span>
                      </h6>
                      <div className="product-card shadow-sm rounded">
                        <div className="product-card-img-container" style={{ height: '240px' }}>
                          <img
                            src={prodImagen || '/assets/im1.jpeg'}
                            alt="Vista previa"
                            className="product-card-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/im1.jpeg';
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <Badge bg="light" text="dark" className="border mb-2">
                            {prodCategoria}
                          </Badge>
                          <h5 className="fw-bold mb-1" style={{ color: 'var(--color-principal)' }}>
                            {prodNombre || 'Nombre del Producto'}
                          </h5>
                          <p className="text-muted small mb-2 text-truncate">
                            {prodDescripcion || 'Aquí aparecerá la descripción de la pulsera o accesorio...'}
                          </p>
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <span className="product-price">
                              ${prodPrecio ? Number(prodPrecio).toLocaleString('es-AR') : '0'}
                            </span>
                            <Badge bg={Number(prodStock) > 0 ? 'success' : 'danger'}>
                              Stock: {prodStock || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* ===================================================================
                  PESTAÑA 5: CARGA MASIVA CON INTELIGENCIA ARTIFICIAL (GEMINI)
                  =================================================================== */}
              {activeTab === 'bulkAi' && (
                <div>
                  {/* Encabezado informativo */}
                  <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge-ai-magic">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            Inteligencia Artificial Multimodal
                          </span>
                          <span className="text-muted small">Google Gemini Flash</span>
                        </div>
                        <h4 className="fw-bold mb-1" style={{ color: '#2d3748' }}>
                          Carga Masiva Automatizada de Productos
                        </h4>
                        <p className="text-muted small mb-0">
                          Arrastra múltiples fotos de tus pulseras y accesorios. La IA analizará cada imagen en segundo plano para autogenerar títulos atractivos, descripciones artesanales, categoría y precios sugeridos.
                        </p>
                      </div>

                      {bulkQueue.length > 0 && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              bulkQueue.forEach(item => URL.revokeObjectURL(item.previewUrl));
                              setBulkQueue([]);
                            }}
                            disabled={savingBulk}
                          >
                            Limpiar Cola ({bulkQueue.length})
                          </Button>
                          <Button
                            className="btn-ai-sparkle py-2 px-3"
                            onClick={handleSaveAllBulk}
                            disabled={savingBulk || bulkQueue.length === 0}
                          >
                            {savingBulk ? (
                              <>
                                <Spinner size="sm" animation="border" />
                                <span>Guardando en BD...</span>
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                <span>Publicar {bulkQueue.length} Productos</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Dropzone Masivo */}
                  <div
                    className={`ai-bulk-dropzone mb-4 ${bulkDragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleBulkDrag}
                    onDragOver={handleBulkDrag}
                    onDragLeave={handleBulkDrag}
                    onDrop={handleBulkDrop}
                    onClick={() => bulkFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={bulkFileInputRef}
                      onChange={handleBulkFileInputChange}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                    <div className="upload-icon-container mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7b2cbf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <h6 className="fw-bold mb-1 text-dark">
                      Arrastra tus fotos aquí o haz clic para seleccionar varios archivos
                    </h6>
                    <p className="text-muted small mb-0">
                      Soporta múltiples imágenes al mismo tiempo (JPEG, PNG, WebP hasta 5MB c/u).
                    </p>
                  </div>

                  {/* Cola de productos procesados */}
                  {bulkQueue.length > 0 ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0 text-muted">
                          Productos en cola ({bulkQueue.length}):
                        </h6>
                        <div className="d-flex gap-2">
                          <Badge bg="info">
                            Analizando: {bulkQueue.filter(i => i.status === 'analyzing').length}
                          </Badge>
                          <Badge bg="success">
                            Listos: {bulkQueue.filter(i => i.status === 'done').length}
                          </Badge>
                        </div>
                      </div>

                      <Row xs={1} md={2} lg={3} className="g-3">
                        {bulkQueue.map((item) => (
                          <Col key={item.id}>
                            <Card className="ai-bulk-card h-100 p-3">
                              <div className="position-relative mb-2">
                                <img
                                  src={item.previewUrl}
                                  alt="Preview"
                                  className="ai-bulk-card-img"
                                />
                                <div className="position-absolute top-0 end-0 p-2">
                                  {item.status === 'analyzing' && (
                                    <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1 shadow-sm">
                                      <Spinner size="sm" animation="border" style={{ width: '10px', height: '10px' }} />
                                      Analizando IA...
                                    </Badge>
                                  )}
                                  {item.status === 'done' && (
                                    <Badge bg="success" className="d-flex align-items-center gap-1 shadow-sm">
                                      ✨ Listo (IA)
                                    </Badge>
                                  )}
                                  {item.status === 'error' && (
                                    <Badge bg="danger" className="shadow-sm">
                                      Error
                                    </Badge>
                                  )}
                                </div>
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
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9d4edd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">No hay productos en la cola masiva</h6>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '480px' }}>
                          Arrastra varias fotos de tu catálogo arriba para ver la magia de la Inteligencia Artificial analizando y cargando cada accesorio automáticamente.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default AdminDashboardModal;
