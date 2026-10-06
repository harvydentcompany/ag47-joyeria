'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Yaosalazar1986@') {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96 border border-amber-100">
          <h2 className="text-2xl font-bold mb-6 text-center text-amber-900">Panel Admin AG47</h2>
          {error && <p className="text-red-500 text-sm mb-4 text-center font-medium">Contraseña incorrecta</p>}
          <input 
            type="password" 
            placeholder="Introduce tu contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-600"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-amber-700 text-white p-3 rounded-lg font-semibold hover:bg-amber-800 transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-400">Sesión de Administrador Segura</span>
        <button 
          onClick={() => {
            localStorage.removeItem('admin_auth');
            setIsAuthenticated(false);
          }}
          className="bg-red-600 text-white px-3 py-1.5 rounded font-bold hover:bg-red-500 transition"
        >
          Cerrar Sesión
        </button>
      </div>
      <AdminDashboard />
    </div>
  );
}

function AdminDashboard() {
  const [seccion, setSeccion] = useState('pedidos');

  // Categorías fijas del catálogo
  const categoriasBase = ['Pulseras', 'Anillos', 'Cadenas', 'Aretes', 'Gargantillas', 'Dijes'];

  // ID del cliente desplegado en la sección B2B
  const [clienteDesplegadoId, setClienteDesplegadoId] = useState<number | null>(1);

  // CREDENCIALES DEL ADMINISTRADOR PRINCIPAL
  const [adminCredenciales, setAdminCredenciales] = useState({
    usuario: 'admin',
    password: '1234'
  });

  const [formAdminCred, setFormAdminCred] = useState({
    usuario: adminCredenciales.usuario,
    password: adminCredenciales.password
  });

  // BANCO DE IMÁGENES SIMULADO DE GOOGLE DRIVE / ARCHIVOS CLOUD (ESTILO GALERÍA REFERENCIA)
  const [galeriaDrive] = useState([
    { id: 'img_1', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', nombre: '2.1_T8.jpg' },
    { id: 'img_2', url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800', nombre: '2.7_T8.jpg' },
    { id: 'img_3', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', nombre: '2.8_T7_9.5.jpg' },
    { id: 'img_4', url: 'https://images.unsplash.com/photo-1611591475170-22c2a382c069?w=800', nombre: '2.5_T8.5.jpg' },
    { id: 'img_5', url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800', nombre: 'Aretes_Pave.jpg' },
    { id: 'img_6', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', nombre: 'Dije_Medalla.jpg' }
  ]);

  // ESTADO MODAL SELECTOR DE DRIVE / GALERÍA
  const [modalGaleriaAbierto, setModalGaleriaAbierto] = useState(false);
  const [imagenesSeleccionadasTemp, setImagenesSeleccionadasTemp] = useState<string[]>([]);
  const [filtroGaleriaDrive, setFiltroGaleriaDrive] = useState('');

  // 1. VENDEDORES / TRABAJADORES CON USUARIO Y CONTRASEÑA
  const [vendedores, setVendedores] = useState([
    { id: 1, nombre: 'Marta Gómez', telefono: '4444-0101', usuario: 'marta', password: 'marta2026', ventasRealizadas: 14, totalVendido: 12450 },
    { id: 2, nombre: 'Juan Pérez', telefono: '4444-0202', usuario: 'juan', password: 'juan2026', ventasRealizadas: 8, totalVendido: 7800 },
  ]);
  const [nuevoVendedor, setNuevoVendedor] = useState({ nombre: '', telefono: '', usuario: '', password: '' });

  // 2. CLIENTES MAYORISTAS CON TARIFAS, LÍNEA DE CRÉDITO Y CUENTAS POR COBRAR (Sincronizado con Supabase)
  const [mayoristas, setMayoristas] = useState([
    { 
      id: 1, 
      nombre: 'María López', 
      telefono: '5555-0101', 
      email: 'maria@ejemplo.com',
      usuario: 'marialopez',
      password: '123',
      direccion: 'Zona 10, Guatemala',
      nit: '1234567-8',
      estado: 'Autorizada', 
      vendedorAsignado: 'Marta Gómez',
      comprasContado: 9,
      comprasCredito: 3,
      creditosCancelados: 2,
      tieneCredito: true,
      limiteCredito: 5000,
      diasCredito: 30,
      saldoDeuda: 1200,
      preciosGramoPorCategoria: { Pulseras: 36, Anillos: 38, Cadenas: 35, Aretes: 40, Gargantillas: 37, Dijes: 39 }
    },
    { 
      id: 2, 
      nombre: 'Marta Gómez', 
      telefono: '5555-0202', 
      email: 'marta@ejemplo.com',
      usuario: 'martagomez',
      password: '123',
      direccion: 'Zona 1, Quetzaltenango',
      nit: '8765432-1',
      estado: 'Autorizada', 
      vendedorAsignado: 'Marta Gómez',
      comprasContado: 5,
      comprasCredito: 0,
      creditosCancelados: 0,
      tieneCredito: false,
      limiteCredito: 0,
      diasCredito: 0,
      saldoDeuda: 0,
      preciosGramoPorCategoria: { Pulseras: 33, Anillos: 35, Cadenas: 32, Aretes: 36, Gargantillas: 34, Dijes: 35 }
    },
    { 
      id: 3, 
      nombre: 'Carlos Pérez', 
      telefono: '5555-0303', 
      email: 'carlos@ejemplo.com',
      usuario: 'carlosperez',
      password: '123',
      direccion: 'Zona 11, Guatemala',
      nit: '5544332-1',
      estado: 'Pendiente', 
      vendedorAsignado: 'Juan Pérez',
      comprasContado: 0,
      comprasCredito: 0,
      creditosCancelados: 0,
      tieneCredito: false,
      limiteCredito: 0,
      diasCredito: 0,
      saldoDeuda: 0,
      preciosGramoPorCategoria: { Pulseras: 35, Anillos: 37, Cadenas: 34, Aretes: 38, Gargantillas: 36, Dijes: 37 }
    },
  ]);

  // CARGAR CLIENTES MAYORISTAS DESDE SUPABASE AL ABRIR EL ADMIN
  useEffect(() => {
    const cargarMayoristasSupabase = async () => {
      const { data, error } = await supabase.from('mayoristas').select('*');
      if (!error && data && data.length > 0) {
        const mayoristasMapeados = data.map((item: any) => ({
          id: item.id || Date.now(),
          nombre: item.nombre || 'Sin nombre',
          telefono: item.telefono || '',
          email: item.correo || '',
          usuario: item.usuario || (item.nombre || 'usuario').toLowerCase().replace(/\s+/g, ''),
          password: item.password || '123',
          direccion: '',
          nit: 'CF',
          estado: item.estado || 'Pendiente',
          vendedorAsignado: 'Marta Gómez',
          comprasContado: 0,
          comprasCredito: 0,
          creditosCancelados: 0,
          tieneCredito: item.tiene_credito || false,
          limiteCredito: item.limite_credito || 0,
          diasCredito: item.dias_credito || 15,
          saldoDeuda: 0,
          preciosGramoPorCategoria: item.precios_gramo || { Pulseras: 36, Anillos: 36, Cadenas: 36, Aretes: 36, Gargantillas: 36, Dijes: 36 }
        }));
        setMayoristas(prev => {
          const existentesIds = new Set(prev.map(p => p.id));
          const nuevosUnicos = mayoristasMapeados.filter((m: any) => !existentesIds.has(m.id));
          return [...prev, ...nuevosUnicos];
        });
      }
    };
    cargarMayoristasSupabase();
  }, []);

  // FUNCIÓN PARA GUARDAR CAMBIOS DE UN CLIENTE DIRECTAMENTE EN SUPABASE
  const guardarClienteEnSupabase = async (clienteActualizado: any) => {
    const { error } = await supabase
      .from('mayoristas')
      .upsert([
        {
          id: clienteActualizado.id,
          nombre: clienteActualizado.nombre,
          telefono: clienteActualizado.telefono,
          correo: clienteActualizado.email || 'No proporcionado',
          usuario: clienteActualizado.usuario,
          password: clienteActualizado.password,
          estado: clienteActualizado.estado,
          tiene_credito: clienteActualizado.tieneCredito,
          limite_credito: clienteActualizado.limiteCredito,
          dias_credito: clienteActualizado.diasCredito,
          precios_gramo: clienteActualizado.preciosGramoPorCategoria
        }
      ]);

    if (error) {
      console.error('Error al sincronizar con Supabase:', error);
      alert('Error al guardar en Supabase: ' + error.message);
    } else {
      alert(`¡Cambios guardados y sincronizados para ${clienteActualizado.nombre}!`);
    }
  };

  const [nuevoCliente, setNuevoCliente] = useState({ 
    nombre: '', 
    telefono: '', 
    tarifaG: 36,
    vendedorAsignado: 'Marta Gómez',
    tieneCredito: false,
    limiteCredito: 0,
    diasCredito: 15
  });

  const [montoAbonoInput, setMontoAbonoInput] = useState<Record<number, number>>({});

  // 3. PRODUCTOS E INVENTARIO CON CÓDIGO DE BARRAS, TALLAS Y MEDIDAS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [productos, setProductos] = useState([
    { 
      id: 101, 
      sku: 'ANI-012', 
      barcode: '740100200301',
      nombre: 'Anillo Zirconia Garra', 
      categoria: 'Anillos', 
      precioMinorista: 220, 
      fotos: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'],
      variantes: [
        { id: 'v1', medida: 'Talla 6', peso: 3.2, stock: 5 },
        { id: 'v2', medida: 'Talla 7', peso: 3.5, stock: 8 },
        { id: 'v3', medida: 'Talla 8', peso: 3.8, stock: 2 },
      ]
    },
    { 
      id: 102, 
      sku: 'CAD-005', 
      barcode: '740100200302',
      nombre: 'Cadena Escalera Plata 925', 
      categoria: 'Cadenas', 
      precioMinorista: 600, 
      fotos: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
      variantes: [
        { id: 'v4', medida: '45 cm', peso: 10.5, stock: 4 },
        { id: 'v5', medida: '50 cm', peso: 12.0, stock: 6 },
      ]
    },
    { 
      id: 103, 
      sku: 'PUL-088', 
      barcode: '740100200303',
      nombre: 'Pulsera Tejido Italiano', 
      categoria: 'Pulseras', 
      precioMinorista: 450, 
      fotos: ['https://images.unsplash.com/photo-1611591475170-22c2a382c069?w=800'],
      variantes: [
        { id: 'v6', medida: '18 cm', peso: 8.5, stock: 6 }
      ]
    }
  ]);

  const [nuevoProd, setNuevoProd] = useState({
    sku: '', 
    barcode: '',
    nombre: '', 
    categoria: 'Anillos', 
    precioMinorista: 0, 
    fotos: [] as string[],
    variantes: [{ medida: 'Talla 6', peso: 0, stock: 0 }]
  });

  // 4. PORTADA, MARCA, ESTILOS, DIRECCIONES, TELÉFONOS, REDES Y "NOSOTROS"
  const [portada, setPortada] = useState(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('config_portada_ag47');
      if (guardado) {
        try { return JSON.parse(guardado); } catch(e) {}
      }
    }
    return {
      logoUrl: 'https://via.placeholder.com/150/000000/FFFFFF?text=AG47+Logo',
      titulo: 'Colección Mayorista y Minorista',
      subtitulo: 'Especial de Temporada - Joyería en Plata 925',
      bannerUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200',
      fuenteEstilo: 'font-sans',
      colorWebPrincipal: '#f59e0b',
      colorWebFondo: '#020617',
      colorWebTexto: '#ffffff',
      direcciones: ['Zona 10, Edificio Las Margaritas, Ciudad de Guatemala', 'Centro Comercial Pradera Zona 4, Quetzaltenango'],
      telefonos: ['+502 5555-1234', '+502 4444-5678'],
      redesSociales: {
        facebook: 'https://facebook.com/ag47joyeria',
        instagram: 'https://instagram.com/ag47joyeria',
        tiktok: 'https://tiktok.com/@ag47joyeria',
        whatsapp: 'https://wa.me/50255551234'
      },
      nosotrosTexto: 'En AG47 nos especializamos en la fabricación, distribución al por mayor y detal de exclusiva joyería en Plata 925 con altos estándares de calidad, diseño y elegancia.'
    };
  });

  // EFECTO DE GUARDADO AUTOMÁTICO PARA QUE NO SE PIERDAN LOS AJUSTES Y SE SINCRONICE CON LA WEB
  useEffect(() => {
    localStorage.setItem('config_portada_ag47', JSON.stringify(portada));
  }, [portada]);

  const guardarConfiguracionPortada = () => {
    localStorage.setItem('config_portada_ag47', JSON.stringify(portada));
    alert('¡Configuración de marca, textos y estilos guardada con éxito y sincronizada con la web!');
  };

  // 5. PEDIDOS CON ESTADOS DE REVISIÓN SOLICITADOS (SINCRONIZADOS CON LOCALSTORAGE)
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('Todos');
  const [pedidos, setPedidos] = useState(() => {
    if (typeof window !== 'undefined') {
      const guardados = localStorage.getItem('ag47_pedidos_admin');
      if (guardados) {
        try { return JSON.parse(guardados); } catch(e) {}
      }
    }
    return [
      {
        id: 1042,
        cliente: 'María López',
        tarifaG: 36,
        estado: 'Pendiente de revisar',
        fecha: '2026-09-24',
        items: [
          { id: 1, productoId: 101, nombre: 'Anillo Zirconia (Talla 7)', peso: 3.5, cantidadSolicitada: 2, cantidadDisponible: 2, estado: 'Disponible' },
          { id: 2, productoId: 102, nombre: 'Cadena Escalera (50 cm)', peso: 12.0, cantidadSolicitada: 1, cantidadDisponible: 0, estado: 'Agotado' }
        ]
      },
      {
        id: 1043,
        cliente: 'Marta Gómez',
        tarifaG: 33,
        estado: 'Por confirmar cambios',
        fecha: '2026-09-23',
        items: [
          { id: 3, productoId: 101, nombre: 'Anillo Zirconia (Talla 6)', peso: 3.2, cantidadSolicitada: 5, cantidadDisponible: 3, estado: 'Disponible' }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ag47_pedidos_admin', JSON.stringify(pedidos));
  }, [pedidos]);

  const [pedidoDetalleModal, setPedidoDetalleModal] = useState<any>(null);

  // 6. CÓDIGOS DE DESCUENTO CON SELECCIÓN DE PRODUCTO POR CÓDIGO DE BARRAS E IMAGEN
  const [cupones, setCupones] = useState([
    { 
      id: 1, 
      codigo: 'PLATA10', 
      tipo: 'porcentaje', 
      valor: 10, 
      usoLimite: 50, 
      usosActuales: 12, 
      activo: true,
      aplicaA: 'especificos',
      productosIds: [101]
    },
    { 
      id: 2, 
      codigo: 'REGALO50', 
      tipo: 'fijo', 
      valor: 50, 
      usoLimite: 20, 
      usosActuales: 5, 
      activo: true,
      aplicaA: 'todos',
      productosIds: []
    },
  ]);

  const [nuevoCupon, setNuevoCupon] = useState({
    codigo: '',
    tipo: 'porcentaje',
    valor: 0,
    usoLimite: 10,
    aplicaA: 'todos',
    productosIds: [] as number[]
  });

  const [busquedaProductoCupon, setBusquedaProductoCupon] = useState('');

  const [mensajePromo, setMensajePromo] = useState({
    asunto: '¡Tienes un código de descuento especial en AG47!',
    contenido: 'Hola {{nombre}}, queremos regalarte un cupón exclusivo para tu próxima compra en plata 925.',
    codigoAdjunto: 'PLATA10',
    canalWhatsapp: true,
    canalEmail: true,
    destinatarioGrupo: 'todos'
  });

  const [reportes] = useState({
    ventasContado: 26050,
    creditosCanceladosMonto: 11200,
    creditosPendientesMonto: 1200,
    clientesDeudores: 1,
    carritosAbandonados: 5,
    montoCarritosAbandonados: 2850,
    pedidosWebMayor: 18,
    pedidosWebMenor: 24,
    pedidosTiendaPos: 32
  });

  // EXPORTAR CATÁLOGO A FORMATO CSV (INCLUYENDO ENLACES SELECCIONADOS DEL DRIVE)
  const exportarCatalogoCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,SKU,Barcode,Nombre,Categoria,PrecioMinorista,ImagenURL_1,ImagenURL_2\n";
    
    productos.forEach(p => {
      const img1 = p.fotos[0] || '';
      const img2 = p.fotos[1] || '';
      const row = `"${p.sku}","${p.barcode || ''}","${p.nombre}","${p.categoria}",${p.precioMinorista},"${img1}","${img2}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catalogo_joyeria_ag47_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // FUNCIONES DE TRABAJADORES / VENDEDORES
  const agregarVendedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoVendedor.nombre || !nuevoVendedor.usuario || !nuevoVendedor.password) {
      return alert('Completa el nombre, usuario y contraseña del trabajador.');
    }
    setVendedores([
      ...vendedores,
      { ...nuevoVendedor, id: Date.now(), ventasRealizadas: 0, totalVendido: 0 }
    ]);
    setNuevoVendedor({ nombre: '', telefono: '', usuario: '', password: '' });
    alert('Trabajador registrado con éxito.');
  };

  const actualizarCredencialesVendedor = (id: number, campo: string, valor: string) => {
    setVendedores(vendedores.map(v => v.id === id ? { ...v, [campo]: valor } : v));
  };

  const guardarCredencialesAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAdminCred.usuario || !formAdminCred.password) {
      return alert('El usuario y la contraseña de administrador no pueden estar vacíos.');
    }
    setAdminCredenciales(formAdminCred);
    alert('Credenciales de Administrador actualizadas correctamente.');
  };

  const toggleSeleccionProductoCupon = (prodId: number) => {
    if (nuevoCupon.productosIds.includes(prodId)) {
      setNuevoCupon({
        ...nuevoCupon,
        productosIds: nuevoCupon.productosIds.filter(id => id !== prodId)
      });
    } else {
      setNuevoCupon({
        ...nuevoCupon,
        productosIds: [...nuevoCupon.productosIds, prodId]
      });
    }
  };

  const crearCupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCupon.codigo) return;
    if (nuevoCupon.aplicaA === 'especificos' && nuevoCupon.productosIds.length === 0) {
      return alert('Por favor selecciona al menos un producto.');
    }

    setCupones([
      ...cupones,
      {
        ...nuevoCupon,
        id: Date.now(),
        codigo: nuevoCupon.codigo.toUpperCase().trim(),
        valor: Number(nuevoCupon.valor),
        usoLimite: Number(nuevoCupon.usoLimite),
        usosActuales: 0,
        activo: true
      }
    ]);
    setNuevoCupon({ codigo: '', tipo: 'porcentaje', valor: 0, usoLimite: 10, aplicaA: 'todos', productosIds: [] });
    setBusquedaProductoCupon('');
    alert('Código de descuento activado correctamente.');
  };

  const cambiarEstadoCupon = (id: number) => {
    setCupones(cupones.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const enviarPromocionMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    let canales = [];
    if (mensajePromo.canalWhatsapp) canales.push('WhatsApp');
    if (mensajePromo.canalEmail) canales.push('Correo Electrónico');

    alert(`Promoción y código "${mensajePromo.codigoAdjunto}" enviados vía ${canales.join(' y ')}.`);
  };

  const productosFiltradosParaCupon = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProductoCupon.toLowerCase()) ||
    p.sku.toLowerCase().includes(busquedaProductoCupon.toLowerCase()) ||
    (p.barcode && p.barcode.includes(busquedaProductoCupon))
  );

  const agregarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCliente.nombre) return;
    const base = Number(nuevoCliente.tarifaG);
    const preciosBase: Record<string, number> = {};
    categoriasBase.forEach(c => preciosBase[c] = base);

    const idUnico = Date.now();
    const usuarioGen = nuevoCliente.nombre.toLowerCase().replace(/\s+/g, '');
    const passGen = '123';

    await supabase.from('mayoristas').insert([
      {
        id: idUnico,
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
        correo: 'No proporcionado',
        usuario: usuarioGen,
        password: passGen,
        estado: 'Autorizada',
        tiene_credito: nuevoCliente.tieneCredito,
        limite_credito: nuevoCliente.limiteCredito,
        dias_credito: nuevoCliente.diasCredito,
        precios_gramo: preciosBase
      }
    ]);

    const nuevoObj = {
      id: idUnico,
      nombre: nuevoCliente.nombre,
      telefono: nuevoCliente.telefono,
      email: '',
      usuario: usuarioGen,
      password: passGen,
      direccion: '',
      nit: 'CF',
      estado: 'Autorizada',
      vendedorAsignado: nuevoCliente.vendedorAsignado,
      comprasContado: 0,
      comprasCredito: 0,
      creditosCancelados: 0,
      tieneCredito: nuevoCliente.tieneCredito,
      limiteCredito: Number(nuevoCliente.limiteCredito),
      diasCredito: Number(nuevoCliente.diasCredito),
      saldoDeuda: 0,
      preciosGramoPorCategoria: preciosBase
    };

    setMayoristas([...mayoristas, nuevoObj]);
    setNuevoCliente({ 
      nombre: '', 
      telefono: '', 
      tarifaG: 36, 
      vendedorAsignado: vendedores[0]?.nombre || 'Marta Gómez',
      tieneCredito: false, 
      limiteCredito: 0, 
      diasCredito: 15 
    });
    setClienteDesplegadoId(idUnico);
    alert('Cliente registrado con éxito y sincronizado con Supabase.');
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    const actualizados = mayoristas.map(m => m.id === id ? { ...m, estado: nuevoEstado } : m);
    setMayoristas(actualizados);
    const clienteModificado = actualizados.find(m => m.id === id);
    if (clienteModificado) {
      await guardarClienteEnSupabase(clienteModificado);
    }
  };

  const cambiarPrecioCategoria = (clienteId: number, categoria: string, nuevoPrecio: number) => {
    setMayoristas(mayoristas.map(m => {
      if (m.id === clienteId) {
        return {
          ...m,
          preciosGramoPorCategoria: {
            ...m.preciosGramoPorCategoria,
            [categoria]: nuevoPrecio
          }
        };
      }
      return m;
    }));
  };

  const actualizarCreditoCliente = (clienteId: number, campo: string, valor: any) => {
    setMayoristas(mayoristas.map(m => m.id === clienteId ? { ...m, [campo]: valor } : m));
  };

  // FUNCIÓN PARA ENVIAR ACCESOS VÍA WHATSAPP AL CLIENTE
  const enviarAccesosWhatsapp = (cliente: any) => {
    let mensaje = `¡Hola *${cliente.nombre}*! Tu cuenta mayorista en *AG47* ha sido habilitada.\n\n`;
    mensaje += `Tus datos de acceso al Portal B2B son:\n`;
    mensaje += `• Usuario: *${cliente.usuario}*\n`;
    mensaje += `• Contraseña: *${cliente.password}*\n\n`;
    mensaje += `Ya puedes ingresar y cotizar con tus tarifas preferenciales. ¡Bienvenido/a!`;

    const url = `https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const agregarCampoVariante = () => {
    setNuevoProd({
      ...nuevoProd,
      variantes: [...nuevoProd.variantes, { medida: '', peso: 0, stock: 0 }]
    });
  };

  const actualizarVarianteForm = (index: number, campo: string, valor: any) => {
    const nuevasVar = [...nuevoProd.variantes];
    nuevasVar[index] = { ...nuevasVar[index], [campo]: valor };
    setNuevoProd({ ...nuevoProd, variantes: nuevasVar });
  };

  const agregarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoProd.fotos.length === 0) {
      return alert('Por favor selecciona al menos una imagen de la galería de Google Drive.');
    }

    const productoCreado = { 
      ...nuevoProd, 
      id: Date.now(), 
      precioMinorista: Number(nuevoProd.precioMinorista) 
    };

    const nuevosProductos = [...productos, productoCreado];
    setProductos(nuevosProductos);
    localStorage.setItem('ag47_inventario_admin', JSON.stringify(nuevosProductos));
    
    setNuevoProd({ sku: '', barcode: '', nombre: '', categoria: 'Anillos', precioMinorista: 0, fotos: [], variantes: [{ medida: 'Talla 6', peso: 0, stock: 0 }] });
    alert('Joya guardada y sincronizada correctamente con la tienda.');
  };

  const productosFiltrados = categoriaSeleccionada === 'Todas' 
    ? productos 
    : productos.filter(p => p.categoria === categoriaSeleccionada);

  const cambiarEstadoPedidoDirecto = (pedidoId: number, nuevoEstado: string) => {
    setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
  };

  const guardarRevisionPedido = () => {
    setPedidos(pedidos.map(p => p.id === pedidoDetalleModal.id ? pedidoDetalleModal : p));
    setPedidoDetalleModal(null);
    alert('Pedido guardado con su nuevo estado.');
  };

  const pedidosFiltrados = filtroEstadoPedido === 'Todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstadoPedido);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* MENÚ LATERAL */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center space-x-3 mb-8 px-2">
            <div className="w-8 h-8 bg-amber-500 text-slate-950 font-bold rounded flex items-center justify-center font-serif">AG</div>
            <div>
              <h1 className="font-serif font-bold text-sm text-white">AG47 ADMIN</h1>
              <p className="text-[10px] text-amber-400 font-mono">Control Unificado</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button onClick={() => setSeccion('pedidos')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'pedidos' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>📦</span>
              <span>Pedidos En Revisión</span>
            </button>

            <button onClick={() => setSeccion('promociones')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'promociones' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>🏷️</span>
              <span>Promociones & Cupones</span>
            </button>

            <button onClick={() => setSeccion('mayoristas')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'mayoristas' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>👥</span>
              <span>Clientes & Créditos B2B</span>
            </button>

            <button onClick={() => setSeccion('productos')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'productos' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>💎</span>
              <span>Productos y Barcodes</span>
            </button>

            <button onClick={() => setSeccion('reportes')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'reportes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>📊</span>
              <span>Reportes & Analíticas</span>
            </button>

            <button onClick={() => setSeccion('vendedores')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'vendedores' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>👔</span>
              <span>Vendedores & Métricas</span>
            </button>

            <button onClick={() => setSeccion('portada')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'portada' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>🎨</span>
              <span>Marca, Textos & Estilos</span>
            </button>
          </nav>
        </div>

        <div className="space-y-2">
          <button onClick={exportarCatalogoCSV} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded font-bold shadow transition">
            📥 Exportar CSV con links Drive
          </button>
          <a href="/" className="block text-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded font-bold">
            ↗ Ver Tienda Pública
          </a>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* PEDIDOS */}
        {seccion === 'pedidos' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-400">Gestión de Pedidos & Revisiones</h2>
                <p className="text-xs text-slate-400">Clasifica el estado de solicitudes y coordina cambios.</p>
              </div>

              <div className="flex flex-wrap gap-1 bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                {['Todos', 'Pendiente de revisar', 'Por confirmar cambios', 'Revisado', 'Cancelado'].map((est) => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstadoPedido(est)}
                    className={`px-3 py-1.5 rounded transition ${
                      filtroEstadoPedido === est ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {pedidosFiltrados.map((ped) => (
                <div key={ped.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">Pedido #{ped.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400 font-bold">{ped.cliente}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Tarifa Aplicada: Q{ped.tarifaG}/g | Fecha: {ped.fecha}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select 
                        value={ped.estado} 
                        onChange={(e) => cambiarEstadoPedidoDirecto(ped.id, e.target.value)}
                        className="p-1.5 rounded font-bold text-xs bg-slate-950 border border-slate-700 text-amber-400"
                      >
                        <option value="Pendiente de revisar">🟡 Pendiente de revisar</option>
                        <option value="Por confirmar cambios">🔵 Por confirmar cambios</option>
                        <option value="Revisado">🟢 Revisado</option>
                        <option value="Cancelado">🔴 Cancelado</option>
                      </select>

                      <button onClick={() => setPedidoDetalleModal(ped)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs">
                        🔍 Revisar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pedidoDetalleModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-2xl w-full space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-amber-400 text-sm">Revisión Pedido #{pedidoDetalleModal.id}</h3>
                      <p className="text-slate-400 text-[11px]">Cliente: {pedidoDetalleModal.cliente} | Fecha: {pedidoDetalleModal.fecha}</p>
                    </div>
                    <button onClick={() => setPedidoDetalleModal(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
                  </div>

                  <div className="space-y-3">
                    <p className="font-bold uppercase text-amber-400">Artículos Solicitados y Disponibilidad:</p>
                    
                    {pedidoDetalleModal.items.map((item: any) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white text-sm">{item.nombre}</p>
                            <p className="text-slate-400 text-[11px]">Peso: {item.peso}g | Solicitados: <strong className="text-amber-400">{item.cantidadSolicitada}</strong></p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900">
                          {/* BOTONES SÍ / NO PARA DISPONIBILIDAD */}
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">¿Hay stock?</span>
                            <button
                              type="button"
                              onClick={() => {
                                const itemsActualizados = pedidoDetalleModal.items.map((it: any) => 
                                  it.id === item.id ? { ...it, estado: 'Disponible', cantidadDisponible: it.cantidadSolicitada } : it
                                );
                                setPedidoDetalleModal({ ...pedidoDetalleModal, items: itemsActualizados });
                              }}
                              className={`px-3 py-1 rounded font-bold text-[10px] transition ${
                                item.estado === 'Disponible' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              SÍ
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const itemsActualizados = pedidoDetalleModal.items.map((it: any) => 
                                  it.id === item.id ? { ...it, estado: 'Agotado', cantidadDisponible: 0 } : it
                                );
                                setPedidoDetalleModal({ ...pedidoDetalleModal, items: itemsActualizados });
                              }}
                              className={`px-3 py-1 rounded font-bold text-[10px] transition ${
                                item.estado === 'Agotado' ? 'bg-rose-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              NO
                            </button>
                          </div>

                          {/* CONTROLES PARA SUBIR O BAJAR CANTIDAD DISPONIBLE */}
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Cant. Disponible:</span>
                            <div className="inline-flex items-center border border-slate-700 rounded bg-slate-900">
                              <button
                                type="button"
                                onClick={() => {
                                  const actual = item.cantidadDisponible !== undefined ? item.cantidadDisponible : item.cantidadSolicitada;
                                  const nuevaCant = Math.max(0, actual - 1);
                                  const itemsActualizados = pedidoDetalleModal.items.map((it: any) => 
                                    it.id === item.id ? { ...it, cantidadDisponible: nuevaCant, estado: nuevaCant === 0 ? 'Agotado' : it.estado } : it
                                  );
                                  setPedidoDetalleModal({ ...pedidoDetalleModal, items: itemsActualizados });
                                }}
                                className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                              >
                                ◀
                              </button>
                              
                              <span className="px-3 font-mono font-bold text-amber-400">
                                {item.cantidadDisponible !== undefined ? item.cantidadDisponible : item.cantidadSolicitada}
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const actual = item.cantidadDisponible !== undefined ? item.cantidadDisponible : item.cantidadSolicitada;
                                  const nuevaCant = actual + 1;
                                  const itemsActualizados = pedidoDetalleModal.items.map((it: any) => 
                                    it.id === item.id ? { ...it, cantidadDisponible: nuevaCant, estado: 'Disponible' } : it
                                  );
                                  setPedidoDetalleModal({ ...pedidoDetalleModal, items: itemsActualizados });
                                }}
                                className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                    <button onClick={() => setPedidoDetalleModal(null)} className="bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded">Cancelar</button>
                    <button onClick={guardarRevisionPedido} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded uppercase">Guardar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROMOCIONES */}
        {seccion === 'promociones' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-400">Cupones para Productos Específicos</h2>
              <p className="text-xs text-slate-400">Selecciona las piezas con descuento.</p>
            </div>

            <form onSubmit={crearCupon} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">＋ Configurar Cupón</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Código" value={nuevoCupon.codigo} onChange={(e) => setNuevoCupon({ ...nuevoCupon, codigo: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-amber-400 font-bold uppercase" required />
                <select value={nuevoCupon.tipo} onChange={(e) => setNuevoCupon({ ...nuevoCupon, tipo: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white">
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto Fijo (Q)</option>
                </select>
                <input type="number" placeholder="Valor" value={nuevoCupon.valor || ''} onChange={(e) => setNuevoCupon({ ...nuevoCupon, valor: Number(e.target.value) })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="number" placeholder="Límite usos" value={nuevoCupon.usoLimite || ''} onChange={(e) => setNuevoCupon({ ...nuevoCupon, usoLimite: Number(e.target.value) })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded uppercase text-xs">Activar Cupón</button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Descuento</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {cupones.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-amber-400">{c.codigo}</td>
                      <td className="p-3 font-bold text-white">{c.tipo === 'porcentaje' ? `${c.valor}% OFF` : `Q${c.valor}.00 OFF`}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => cambiarEstadoCupon(c.id)} className={`px-2 py-1 rounded text-[10px] font-bold ${c.activo ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                          {c.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MAYORISTAS */}
        {seccion === 'mayoristas' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-400">Clientes Mayoristas & Cuentas Por Cobrar</h2>
              <p className="text-xs text-slate-400">Edita tarifas, créditos, credenciales y guarda los cambios directamente en Supabase.</p>
            </div>

            <form onSubmit={agregarCliente} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
              <h3 className="font-bold uppercase text-amber-400">＋ Registrar Nuevo Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Nombre" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="number" placeholder="Tarifa Base (Q/g)" value={nuevoCliente.tarifaG} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tarifaG: Number(e.target.value) })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <select value={nuevoCliente.vendedorAsignado} onChange={(e) => setNuevoCliente({ ...nuevoCliente, vendedorAsignado: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white">
                  {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded uppercase">Guardar Cliente</button>
            </form>

            {/* LISTA DE CLIENTES MAYORISTAS CON PESTAÑA DESPLEGABLE */}
            <div className="space-y-4">
              {mayoristas.map((m) => {
                const estaDesplegado = clienteDesplegadoId === m.id;
                return (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                    
                    {/* ENCABEZADO DE CADA CLIENTE */}
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">{m.nombre}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.estado === 'Autorizada' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40' : 'bg-rose-600/20 text-rose-400 border border-rose-600/40'}`}>
                            {m.estado}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">Tel: {m.telefono} | Usuario: <strong className="text-amber-400">{m.usuario || 'N/A'}</strong></p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {m.estado === 'Autorizada' && (
                          <button 
                            onClick={() => enviarAccesosWhatsapp(m)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-[10px] transition flex items-center space-x-1"
                          >
                            <span>💬 Enviar Accesos WhatsApp</span>
                          </button>
                        )}
                        <button 
                          onClick={() => cambiarEstado(m.id, m.estado === 'Autorizada' ? 'Suspendida' : 'Autorizada')} 
                          className={`px-3 py-1.5 rounded font-bold text-[10px] transition ${m.estado === 'Autorizada' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          {m.estado === 'Autorizada' ? '🔴 Suspender Cuenta' : '🟢 Habilitar Cuenta'}
                        </button>
                        <button 
                          onClick={() => setClienteDesplegadoId(estaDesplegado ? null : m.id)} 
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition"
                        >
                          {estaDesplegado ? '▲ Ocultar Ajustes' : '▼ Editar Tarifas y Crédito'}
                        </button>
                      </div>
                    </div>

                    {/* PESTAÑA DESPLEGABLE DE EDICIÓN CON BOTÓN DE GUARDAR */}
                    {estaDesplegado && (
                      <div className="bg-slate-950 p-5 border-t border-slate-800 space-y-6">
                        
                        {/* CREDENCIALES DE ACCESO */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">🔑 Credenciales de Acceso B2B</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 mb-1">Usuario de Acceso:</label>
                              <input 
                                type="text" 
                                value={m.usuario || ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMayoristas(mayoristas.map(item => item.id === m.id ? { ...item, usuario: val } : item));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">Contraseña:</label>
                              <input 
                                type="text" 
                                value={m.password || ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMayoristas(mayoristas.map(item => item.id === m.id ? { ...item, password: val } : item));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* TARIFARIO POR GRAMO POR CATEGORÍA */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">⚖️ Tarifario por Gramo por Categoría (Q)</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {categoriasBase.map((cat) => {
                              const precioActual = m.preciosGramoPorCategoria?.[cat] || 36;
                              return (
                                <div key={cat} className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center space-y-1">
                                  <span className="text-[10px] text-slate-400 uppercase block font-bold">{cat}</span>
                                  <input 
                                    type="number" 
                                    value={precioActual} 
                                    onChange={(e) => cambiarPrecioCategoria(m.id, cat, Number(e.target.value))}
                                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-center text-amber-400 font-bold"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* CRÉDITOS Y LÍNEA DE FINANCIAMIENTO */}
                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">💳 Configuración de Crédito</h4>
                          
                          <div className="flex items-center space-x-3 bg-slate-900 p-3 rounded border border-slate-800">
                            <input 
                              type="checkbox" 
                              checked={m.tieneCredito} 
                              onChange={(e) => actualizarCreditoCliente(m.id, 'tieneCredito', e.target.checked)}
                              className="w-4 h-4 rounded text-amber-500"
                            />
                            <span className="font-bold text-white">Autorizar Línea de Crédito a este cliente</span>
                          </div>

                          {m.tieneCredito && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-slate-400 mb-1">Límite de Crédito Autorizado (Q):</label>
                                <input 
                                  type="number" 
                                  value={m.limiteCredito} 
                                  onChange={(e) => actualizarCreditoCliente(m.id, 'limiteCredito', Number(e.target.value))}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Plazo de Días de Crédito:</label>
                                <input 
                                  type="number" 
                                  value={m.diasCredito} 
                                  onChange={(e) => actualizarCreditoCliente(m.id, 'diasCredito', Number(e.target.value))}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white font-bold"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* BOTÓN DE GUARDAR CAMBIOS EN SUPABASE */}
                        <div className="pt-2 flex justify-end">
                          <button 
                            onClick={() => guardarClienteEnSupabase(m)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded uppercase tracking-wider text-xs shadow transition"
                          >
                            💾 Guardar Cambios en Supabase
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPORTES */}
        {seccion === 'reportes' && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-xl font-bold font-serif text-amber-400">Panel de Reportes de Ventas</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-400">Ventas Contado</p>
                <p className="text-xl font-black text-emerald-400 mt-1">Q{reportes.ventasContado.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-400">Cuentas Por Cobrar</p>
                <p className="text-xl font-black text-rose-400 mt-1">Q{reportes.creditosPendientesMonto.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* VENDEDORES */}
        {seccion === 'vendedores' && (
          <div className="space-y-8 max-w-5xl">
            <h2 className="text-xl font-bold font-serif text-amber-400">Gestión de Trabajadores & Accesos</h2>
            <form onSubmit={agregarVendedor} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold uppercase text-amber-400">＋ Registrar Nuevo Vendedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Nombre" value={nuevoVendedor.nombre} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, nombre: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Teléfono" value={nuevoVendedor.telefono} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, telefono: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Usuario" value={nuevoVendedor.usuario} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, usuario: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Contraseña" value={nuevoVendedor.password} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, password: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" required />
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs uppercase">Crear Perfil</button>
            </form>
          </div>
        )}

        {/* SECCIÓN 5: PRODUCTOS, TALLAS Y SELECTOR MULTIMEDIA DE GOOGLE DRIVE */}
        {seccion === 'productos' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-400">Inventario con Tallas y Medidas</h2>
                <p className="text-xs text-slate-400">Selecciona imágenes desde tu Cloud / Google Drive para asociarlas a la joya.</p>
              </div>
              <button onClick={exportarCatalogoCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded shadow transition">
                📥 Exportar Catálogo CSV (con links Drive)
              </button>
            </div>

            <form onSubmit={agregarProducto} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">＋ Registrar Joya con Medidas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="SKU (ej: ANI-012)" value={nuevoProd.sku} onChange={(e) => setNuevoProd({ ...nuevoProd, sku: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Código de Barras" value={nuevoProd.barcode} onChange={(e) => setNuevoProd({ ...nuevoProd, barcode: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" />
                <input type="text" placeholder="Nombre" value={nuevoProd.nombre} onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <select value={nuevoProd.categoria} onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white">
                  {categoriasBase.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Precio Público (Q)" value={nuevoProd.precioMinorista || ''} onChange={(e) => setNuevoProd({ ...nuevoProd, precioMinorista: Number(e.target.value) })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
              </div>

              {/* SECCIÓN MULTIMEDIA EXACTA A TU SOLICITUD */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-bold text-amber-400 uppercase text-[11px]">Multimedia (Google Drive / Galería Cloud) *</label>
                
                <div 
                  onClick={() => { setImagenesSeleccionadasTemp(nuevoProd.fotos); setModalGaleriaAbierto(true); }}
                  className="w-full py-6 border-2 border-dashed border-amber-500/40 bg-slate-950 hover:bg-slate-900 rounded-xl text-center flex flex-col items-center justify-center space-y-2 cursor-pointer transition group"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-lg border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                    📁
                  </div>
                  <span className="font-bold text-amber-300 text-xs">Seleccionar imágenes desde Google Drive (Estilo Galería)</span>
                  <span className="text-[10px] text-slate-400">({nuevoProd.fotos.length} imágenes seleccionadas para este producto)</span>
                </div>

                {/* MINIATURAS SELECCIONADAS */}
                {nuevoProd.fotos.length > 0 && (
                  <div className="flex gap-2 pt-2 overflow-x-auto">
                    {nuevoProd.fotos.map((imgUrl, idx) => (
                      <img key={idx} src={imgUrl} alt="" className="w-14 h-14 object-cover rounded-lg border-2 border-amber-500 shadow-sm" />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400 uppercase text-[11px]">Tallas / Medidas Individuales:</span>
                  <button type="button" onClick={agregarCampoVariante} className="bg-slate-800 text-amber-400 px-2.5 py-1 rounded font-bold">＋ Agregar Medida</button>
                </div>
                {nuevoProd.variantes.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                    <input type="text" placeholder="Medida (ej. Talla 7)" value={v.medida} onChange={(e) => actualizarVarianteForm(idx, 'medida', e.target.value)} className="p-1.5 bg-slate-900 border border-slate-800 rounded text-white" required />
                    <input type="number" step="0.1" placeholder="Peso (g)" value={v.peso || ''} onChange={(e) => actualizarVarianteForm(idx, 'peso', Number(e.target.value))} className="p-1.5 bg-slate-900 border border-slate-800 rounded text-white" required />
                    <input type="number" placeholder="Stock" value={v.stock || ''} onChange={(e) => actualizarVarianteForm(idx, 'stock', Number(e.target.value))} className="p-1.5 bg-slate-900 border border-slate-800 rounded text-white" required />
                  </div>
                ))}
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs uppercase">Guardar Joya</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productosFiltrados.map((p) => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex space-x-3 items-center">
                    <img src={p.fotos[0]} alt={p.nombre} className="w-16 h-16 object-cover rounded bg-slate-800 shrink-0 border border-slate-700" />
                    <div>
                      <p className="font-bold text-white text-sm">{p.nombre}</p>
                      <p className="text-slate-400">SKU: <span className="text-amber-400 font-mono">{p.sku}</span></p>
                      <p className="font-bold text-emerald-400">Precio Público: Q{p.precioMinorista}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MARCA, ESTILOS, TEXTOS, DIRECCIONES, TELÉFONOS, REDES Y "NOSOTROS" */}
        {seccion === 'portada' && (
          <div className="space-y-6 max-w-4xl text-xs">
            <h2 className="text-xl font-bold font-serif text-amber-400">Marca, Textos, Estilos, Direcciones, Teléfonos y Redes</h2>
            <p className="text-slate-400">Personaliza la apariencia, el contenido de la tienda y la información de contacto oficial.</p>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
              
              {/* TÍTULOS Y TEXTOS */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">📝 Textos Principales de Portada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Título Principal:</label>
                    <input type="text" value={portada.titulo} onChange={(e) => setPortada({ ...portada, titulo: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Subtítulo / Especial:</label>
                    <input type="text" value={portada.subtitulo} onChange={(e) => setPortada({ ...portada, subtitulo: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN NOSOTROS */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">🏢 Edición Sección "Nosotros"</h3>
                <div>
                  <label className="font-bold block mb-1 text-slate-300">Texto Institucional / Quiénes Somos:</label>
                  <textarea 
                    rows={4} 
                    value={portada.nosotrosTexto} 
                    onChange={(e) => setPortada({ ...portada, nosotrosTexto: e.target.value })} 
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white leading-relaxed"
                  />
                </div>
              </div>

              {/* LOGO Y BANNER */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">🖼 URLs de Logo e Imagen de Banner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">URL del Logo:</label>
                    <input type="text" value={portada.logoUrl} onChange={(e) => setPortada({ ...portada, logoUrl: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">URL Imagen Banner:</label>
                    <input type="text" value={portada.bannerUrl} onChange={(e) => setPortada({ ...portada, bannerUrl: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" />
                  </div>
                </div>
              </div>

              {/* ESTILOS Y TIPOGRAFÍA */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">🎨 Estilo de Letra y Paleta de Colores</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Estilo de Tipografía:</label>
                    <select value={portada.fuenteEstilo} onChange={(e) => setPortada({ ...portada, fuenteEstilo: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white font-bold">
                      <option value="font-sans">Moderna (Sans)</option>
                      <option value="font-serif">Elegante / Joyería (Serif)</option>
                      <option value="font-mono">Técnica (Monospace)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Color Principal Web:</label>
                    <input type="color" value={portada.colorWebPrincipal} onChange={(e) => setPortada({ ...portada, colorWebPrincipal: e.target.value })} className="w-full h-10 bg-slate-950 border border-slate-800 rounded cursor-pointer p-1" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Color Fondo Web:</label>
                    <input type="color" value={portada.colorWebFondo} onChange={(e) => setPortada({ ...portada, colorWebFondo: e.target.value })} className="w-full h-10 bg-slate-950 border border-slate-800 rounded cursor-pointer p-1" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Color Texto Web:</label>
                    <input type="color" value={portada.colorWebTexto} onChange={(e) => setPortada({ ...portada, colorWebTexto: e.target.value })} className="w-full h-10 bg-slate-950 border border-slate-800 rounded cursor-pointer p-1" />
                  </div>
                </div>
              </div>

              {/* MÚLTIPLES TELÉFONOS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-bold uppercase text-amber-400">📞 Números de Teléfono (Múltiples)</h3>
                  <button type="button" onClick={() => setPortada({ ...portada, telefonos: [...portada.telefonos, ''] })} className="bg-slate-800 text-amber-400 px-2.5 py-1 rounded font-bold">＋ Agregar Teléfono</button>
                </div>
                <div className="space-y-2">
                  {portada.telefonos.map((tel: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={tel} 
                        onChange={(e) => {
                          const nuevosTels = [...portada.telefonos];
                          nuevosTels[idx] = e.target.value;
                          setPortada({ ...portada, telefonos: nuevosTels });
                        }} 
                        className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded text-white font-mono" 
                        placeholder="+502 0000-0000"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const nuevosTels = portada.telefonos.filter((_: any, i: number) => i !== idx);
                          setPortada({ ...portada, telefonos: nuevosTels });
                        }} 
                        className="bg-rose-600/20 text-rose-400 px-3 py-1 rounded font-bold hover:bg-rose-600 hover:text-white transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MÚLTIPLES DIRECCIONES */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-bold uppercase text-amber-400">📍 Direcciones Físicas / Sucursales</h3>
                  <button type="button" onClick={() => setPortada({ ...portada, direcciones: [...portada.direcciones, ''] })} className="bg-slate-800 text-amber-400 px-2.5 py-1 rounded font-bold">＋ Agregar Dirección</button>
                </div>
                <div className="space-y-2">
                  {portada.direcciones.map((dir: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={dir} 
                        onChange={(e) => {
                          const nuevasDirs = [...portada.direcciones];
                          nuevasDirs[idx] = e.target.value;
                          setPortada({ ...portada, direcciones: nuevasDirs });
                        }} 
                        className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded text-white" 
                        placeholder="Ej. Zona 10, Ciudad de Guatemala"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const nuevasDirs = portada.direcciones.filter((_: any, i: number) => i !== idx);
                          setPortada({ ...portada, direcciones: nuevasDirs });
                        }} 
                        className="bg-rose-600/20 text-rose-400 px-3 py-1 rounded font-bold hover:bg-rose-600 hover:text-white transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* REDES SOCIALES */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">🌐 Enlaces de Redes Sociales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Facebook URL:</label>
                    <input type="text" value={portada.redesSociales.facebook} onChange={(e) => setPortada({ ...portada, redesSociales: { ...portada.redesSociales, facebook: e.target.value } })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white font-mono" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">Instagram URL:</label>
                    <input type="text" value={portada.redesSociales.instagram} onChange={(e) => setPortada({ ...portada, redesSociales: { ...portada.redesSociales, instagram: e.target.value } })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white font-mono" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">TikTok URL:</label>
                    <input type="text" value={portada.redesSociales.tiktok} onChange={(e) => setPortada({ ...portada, redesSociales: { ...portada.redesSociales, tiktok: e.target.value } })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white font-mono" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-300">WhatsApp Enlace Directo:</label>
                    <input type="text" value={portada.redesSociales.whatsapp} onChange={(e) => setPortada({ ...portada, redesSociales: { ...portada.redesSociales, whatsapp: e.target.value } })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-white font-mono" />
                  </div>
                </div>
              </div>

              <button onClick={guardarConfiguracionPortada} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider shadow transition">
                💾 Guardar Configuración General de la Marca
              </button>

            </div>
          </div>
        )}

      </main>

      {/* VENTANA MODAL: SELECTOR ESTILO GALERÍA GOOGLE DRIVE */}
      {modalGaleriaAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-amber-500/40 max-h-[85vh] flex flex-col text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-serif font-bold text-base text-amber-400">Seleccionar imágenes desde Google Drive</h2>
                <p className="text-[11px] text-slate-400">Marca las casillas de verificación de las fotos que deseas asociar al producto.</p>
              </div>
              <button onClick={() => setModalGaleriaAbierto(false)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full font-bold flex items-center justify-center text-white">✕</button>
            </div>

            <div className="flex justify-between items-center gap-4">
              <input 
                type="text" 
                placeholder="Buscar archivo..." 
                value={filtroGaleriaDrive}
                onChange={e => setFiltroGaleriaDrive(e.target.value)}
                className="w-full max-w-sm p-2 bg-slate-950 border border-slate-800 rounded text-white"
              />
              <span className="font-mono font-bold text-amber-400">{imagenesSeleccionadasTemp.length} seleccionadas</span>
            </div>

            {/* CUADRÍCULA DE ARCHIVOS CON CHECKBOXES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto p-2 flex-1">
              {galeriaDrive
                .filter(img => img.nombre.toLowerCase().includes(filtroGaleriaDrive.toLowerCase()))
                .map((img) => {
                  const estaMarcada = imagenesSeleccionadasTemp.includes(img.url);
                  return (
                    <div 
                      key={img.id}
                      onClick={() => {
                        if (estaMarcada) {
                          setImagenesSeleccionadasTemp(imagenesSeleccionadasTemp.filter(u => u !== img.url));
                        } else {
                          setImagenesSeleccionadasTemp([...imagenesSeleccionadasTemp, img.url]);
                        }
                      }}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition flex flex-col justify-end p-2 ${
                        estaMarcada ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                      }`}
                    >
                      <img src={img.url} alt={img.nombre} className="absolute inset-0 w-full h-full object-cover" />
                      
                      {/* CHECKBOX VISUAL SUPERIOR */}
                      <div className="absolute top-3 right-3 w-6 h-6 rounded bg-slate-900/90 border border-slate-600 flex items-center justify-center shadow">
                        {estaMarcada && <span className="text-amber-400 font-bold text-xs">✓</span>}
                      </div>

                      <div className="relative bg-slate-950/80 backdrop-blur-xs text-white p-1 rounded text-[10px] truncate font-mono">
                        {img.nombre}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
              <button onClick={() => setModalGaleriaAbierto(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold uppercase">Cancelar</button>
              <button 
                onClick={() => {
                  setNuevoProd({...nuevoProd, fotos: imagenesSeleccionadasTemp});
                  setModalGaleriaAbierto(false);
                }} 
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold uppercase tracking-wider shadow"
              >
                Insertar Seleccionadas ({imagenesSeleccionadasTemp.length})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
