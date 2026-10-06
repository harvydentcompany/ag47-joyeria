'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TiendaPublica() {
  const [textoBarraAviso] = useState('✨ ENVÍOS A TODA GUATEMALA | JOYERÍA FINA EN PLATA LEY 925 ✨');

  const [vistaActual, setVistaActual] = useState<'inicio' | 'categorias' | 'catalogo' | 'carrito' | 'revision' | 'confirmado' | 'login' | 'registro_mayorista' | 'historial'>('inicio');
  
  const [esMayorista, setEsMayorista] = useState(false);
  const [clienteMayoristaActivo, setClienteMayoristaActivo] = useState<any>(null);

  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [productoSeleccionadoModal, setProductoSeleccionadoModal] = useState<any>(null);
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  const [varianteElegida, setVarianteElegida] = useState<any>(null);
  const [cantidadModal, setCantidadModal] = useState<number>(1);

  const [misPedidos, setMisPedidos] = useState<any[]>([]);

  // DATOS DE CONFIGURACIÓN INSTITUCIONAL EDITABLES DESDE EL ADMIN
  const [infoAdmin, setInfoAdmin] = useState({
    direcciones: ['Ciudad de Guatemala'],
    telefonos: ['(+502) 5555-0101'],
    nosotrosTexto: 'Distribuidor de platería fina en plata ley 925.'
  });

  // INVENTARIO DINÁMICO (Sincronizado con el stock y productos del Admin)
  const [productos, setProductos] = useState([
    {
      id: 101,
      sku: '24665-38850',
      nombre: 'Anillo de Zircones Solitario Garra',
      categoria: 'Anillos',
      precioMinorista: 220,
      esNuevo: true,
      material: 'Plata 925',
      descripcion: 'Anillo de Zircones pavé de alta refracción. Sortija estilo clásico.',
      fotos: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800'
      ],
      variantes: [
        { id: 'v1', medida: '5', peso: 2.3, stock: 5 },
        { id: 'v2', medida: '6', peso: 2.5, stock: 8 },
        { id: 'v3', medida: '7', peso: 2.7, stock: 0 }
      ]
    },
    {
      id: 102,
      sku: 'CAD-005',
      nombre: 'Gargantilla Escalera Plata 925',
      categoria: 'Gargantillas',
      precioMinorista: 600,
      esNuevo: true,
      material: 'Plata 925',
      descripcion: 'Gargantilla de tejido italiano fino con acabado de espejo en plata rodinada.',
      fotos: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'
      ],
      variantes: [
        { id: 'v4', medida: '40 cm', peso: 10.2, stock: 2 },
        { id: 'v5', medida: '45 cm', peso: 11.5, stock: 4 }
      ]
    },
    {
      id: 103,
      sku: 'PUL-088',
      nombre: 'Pulsera Tejido Italiano Dije Corazón',
      categoria: 'Pulseras',
      precioMinorista: 450,
      esNuevo: false,
      material: 'Plata 925',
      descripcion: 'Pulsera elegante en plata 925 con broche marinero reforzado y dije colgante.',
      fotos: [
        'https://images.unsplash.com/photo-1611591475170-22c2a382c069?w=800'
      ],
      variantes: [
        { id: 'v6', medida: '18 cm', peso: 7.8, stock: 6 },
        { id: 'v7', medida: '20 cm', peso: 8.4, stock: 3 }
      ]
    },
    {
      id: 104,
      sku: 'ARE-021',
      nombre: 'Aretes Arrancadas Zirconias Pavé',
      categoria: 'Aretes',
      precioMinorista: 310,
      esNuevo: true,
      material: 'Plata 925',
      descripcion: 'Arrancadas clásicas pavé con incrustaciones de micro zirconias suizas.',
      fotos: [
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800'
      ],
      variantes: [
        { id: 'v8', medida: 'Par Estándar', peso: 4.1, stock: 10 }
      ]
    }
  ]);

  // SINCRONIZACIÓN AUTOMÁTICA CON LOCALSTORAGE (Admin <-> Tienda)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guardadosPedidos = localStorage.getItem('ag47_pedidos_admin');
      if (guardadosPedidos) {
        try { setMisPedidos(JSON.parse(guardadosPedidos)); } catch(e) {}
      }

      const configAdmin = localStorage.getItem('config_portada_ag47');
      if (configAdmin) {
        try {
          const parsed = JSON.parse(configAdmin);
          setInfoAdmin({
            direcciones: parsed.direcciones || ['Ciudad de Guatemala'],
            telefonos: parsed.telefonos || ['(+502) 5555-0101'],
            nosotrosTexto: parsed.nosotrosTexto || 'Distribuidor de platería fina en plata ley 925.'
          });
        } catch(e) {}
      }

      const stockAdmin = localStorage.getItem('ag47_inventario_admin');
      if (stockAdmin) {
        try {
          const parsedStock = JSON.parse(stockAdmin);
          if (Array.isArray(parsedStock) && parsedStock.length > 0) {
            setProductos(parsedStock);
          }
        } catch(e) {}
      }
    }
  }, [vistaActual]);

  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRecordar, setLoginRecordar] = useState(false);
  const [cargandoLogin, setCargandoLogin] = useState(false);

  const [datosRegistroMayorista, setDatosRegistroMayorista] = useState({
    nombreCompleto: '',
    telefono: '',
    correo: '',
    tipoCliente: 'Particular',
    requiereEnvio: false,
    direccion: ''
  });
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const [datosEnvio, setDatosEnvio] = useState({
    nombreCompleto: '',
    telefono: '',
    correo: '',
    direccion: '',
    departamento: 'Guatemala',
    metodoEntrega: 'envio',
    metodoPago: 'contraentrega',
    notaPedido: ''
  });

  const [numeroOrdenGenerado, setNumeroOrdenGenerado] = useState('');

  const [todasLasCategorias] = useState([
    { id: 1, nombre: 'Anillos', foto: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500' },
    { id: 2, nombre: 'Aretes', foto: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500' },
    { id: 3, nombre: 'Gargantillas', foto: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500' },
    { id: 4, nombre: 'Pulseras', foto: 'https://images.unsplash.com/photo-1611591475170-22c2a382c069?w=500' },
    { id: 5, nombre: 'Dijes & Medallas', foto: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500' },
    { id: 6, nombre: 'Cadenas', foto: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500' },
  ]);

  const calcularStockTotalProducto = (prod: any) => {
    if (!prod.variantes || prod.variantes.length === 0) return 0;
    return prod.variantes.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
  };

  const estaEnCarrito = (productoId: number, varianteId?: string) => {
    if (varianteId) {
      return carrito.some(item => item.id === `${productoId}-${varianteId}`);
    }
    return carrito.some(item => item.productoId === productoId);
  };

  const obtenerPrecioCalculado = (producto: any, variante: any) => {
    if (esMayorista && clienteMayoristaActivo) {
      const preciosGramo = clienteMayoristaActivo.precios_gramo || clienteMayoristaActivo.preciosGramoPorCategoria || {};
      const tarifaGramo = preciosGramo[producto.categoria] || 36;
      const pesoUnitario = variante?.peso || producto.variantes[0]?.peso || 1;
      return Number((pesoUnitario * tarifaGramo).toFixed(2));
    }
    return producto.precioMinorista;
  };

  const irACategoriaEspecifica = (nombreCat: string) => {
    setCategoriaFiltro(nombreCat);
    setVistaActual('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModalDetalle = (prod: any) => {
    setProductoSeleccionadoModal(prod);
    setFotoActivaIndex(0);
    const primeraDisponible = prod.variantes.find((v: any) => (v.stock || 0) > 0) || prod.variantes[0] || null;
    setVarianteElegida(primeraDisponible);
    setCantidadModal(1);
  };

  const verProductoDesdeCarrito = (productoId: number) => {
    const productoEncontrado = productos.find(p => p.id === productoId);
    if (productoEncontrado) {
      abrirModalDetalle(productoEncontrado);
    }
  };

  const agregarAlCarritoSilencioso = () => {
    if (!productoSeleccionadoModal || !varianteElegida) return;

    if ((varianteElegida.stock || 0) <= 0) {
      alert('Lo sentimos, esta talla se encuentra AGOTADA actualmente.');
      return;
    }

    const precioCalculado = obtenerPrecioCalculado(productoSeleccionadoModal, varianteElegida);

    const itemEnCarrito = {
      id: `${productoSeleccionadoModal.id}-${varianteElegida.id}`,
      productoId: productoSeleccionadoModal.id,
      sku: productoSeleccionadoModal.sku,
      nombre: productoSeleccionadoModal.nombre,
      medida: varianteElegida.medida,
      pesoUnitario: varianteElegida.peso,
      precio: precioCalculado,
      foto: productoSeleccionadoModal.fotos[0],
      cantidad: cantidadModal,
      stockMaximo: varianteElegida.stock
    };

    const existe = carrito.find(item => item.id === itemEnCarrito.id);
    if (existe) {
      const nuevaCantidadTotal = existe.cantidad + cantidadModal;
      if (nuevaCantidadTotal > varianteElegida.stock) {
        alert(`No puedes agregar más de ${varianteElegida.stock} unidades disponibles en inventario.`);
        return;
      }
      setCarrito(carrito.map(item => item.id === itemEnCarrito.id ? { ...item, cantidad: nuevaCantidadTotal } : item));
    } else {
      setCarrito([...carrito, itemEnCarrito]);
    }

    setProductoSeleccionadoModal(null);
  };

  const modificarCantidad = (id: string, cambio: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + cambio;
        if (item.stockMaximo && nuevaCant > item.stockMaximo) {
          alert('Has alcanzado el límite de stock disponible para esta variante.');
          return item;
        }
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const vaciarCarrito = () => {
    if (confirm('¿Deseas vaciar todos los productos del carrito?')) {
      setCarrito([]);
    }
  };

  const totalPiezas = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalMonto = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const procesarHacerPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datosEnvio.nombreCompleto || !datosEnvio.telefono) {
      alert('Por favor ingresa al menos tu nombre y número de teléfono.');
      return;
    }

    if (datosEnvio.metodoEntrega === 'envio' && !datosEnvio.direccion) {
      alert('Por favor ingresa la dirección de entrega para tu pedido.');
      return;
    }

    const numOrden = Math.floor(1000 + Math.random() * 9000);
    const numOrdenStr = numOrden.toString();
    setNumeroOrdenGenerado(numOrdenStr);

    const nuevoPedidoWeb = {
      id: numOrden,
      cliente: datosEnvio.nombreCompleto,
      telefono: datosEnvio.telefono,
      tarifaG: esMayorista ? 36 : 35,
      estado: 'Pendiente de revisar',
      fecha: new Date().toISOString().slice(0, 10),
      items: carrito.map((item, index) => ({
        id: index + 1,
        productoId: item.productoId,
        nombre: `${item.nombre} (Talla: ${item.medida})`,
        peso: item.pesoUnitario || 0,
        cantidadSolicitada: item.cantidad,
        cantidadDisponible: item.cantidad,
        estado: 'Disponible'
      }))
    };

    await supabase.from('pedidos').insert([
      {
        id: numOrden,
        cliente: datosEnvio.nombreCompleto,
        tarifa_g: esMayorista ? 36 : 35,
        estado: 'Pendiente de revisar',
        fecha: new Date().toISOString().slice(0, 10),
        items: nuevoPedidoWeb.items
      }
    ]);

    const pedidosPrevios = JSON.parse(localStorage.getItem('ag47_pedidos_admin') || '[]');
    const pedidosActualizados = [nuevoPedidoWeb, ...pedidosPrevios];
    localStorage.setItem('ag47_pedidos_admin', JSON.stringify(pedidosActualizados));
    setMisPedidos(pedidosActualizados);
    setCarrito([]);

    setVistaActual('confirmado');
  };

  const enviarConfirmacionCliente = () => {
    let mensaje = `Hola AG47, mi nombre es *${datosEnvio.nombreCompleto}*.\n`;
    mensaje += `Acabo de realizar el pedido *#${numeroOrdenGenerado}* en la página web.\n\n`;
    mensaje += `Quedo a la espera de su confirmación de disponibilidad. ¡Muchas gracias!`;

    const url = `https://wa.me/50255550101?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const ejecutarLoginMayorista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsuario || !loginPassword) return alert('Por favor ingresa tu usuario y contraseña.');

    setCargandoLogin(true);

    const { data, error } = await supabase
      .from('mayoristas')
      .select('*')
      .or(`usuario.eq.${loginUsuario.trim().toLowerCase()},correo.eq.${loginUsuario.trim().toLowerCase()},nombre.ilike.%${loginUsuario.trim()%}`);

    setCargandoLogin(false);

    if (error || !data || data.length === 0) {
      return alert('Usuario o contraseña incorrectos, o la cuenta no existe.');
    }

    const clienteEncontrado = data[0];

    if (clienteEncontrado.password && clienteEncontrado.password !== loginPassword) {
      return alert('Contraseña incorrecta.');
    }

    if (clienteEncontrado.estado === 'Suspendida' || clienteEncontrado.estado === 'Pendiente') {
      return alert(`Tu cuenta se encuentra actualmente con estado: ${clienteEncontrado.estado}. Contacta al administrador.`);
    }

    setEsMayorista(true);
    setClienteMayoristaActivo(clienteEncontrado);
    setVistaActual('inicio');
    alert(`¡Bienvenido/a ${clienteEncontrado.nombre}! Tarifario por gramo activado.`);
  };

  const cerrarSesionMayorista = () => {
    setEsMayorista(false);
    setClienteMayoristaActivo(null);
    setVistaActual('inicio');
  };

  const enviarRegistroMayorista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datosRegistroMayorista.nombreCompleto || !datosRegistroMayorista.telefono) {
      alert('Por favor completa tu nombre y número de teléfono.');
      return;
    }

    const idUnico = Date.now();
    const usuarioGen = datosRegistroMayorista.nombreCompleto.toLowerCase().replace(/\s+/g, '');
    const passGen = '123';

    const { error } = await supabase
      .from('mayoristas')
      .insert([
        {
          id: idUnico,
          nombre: datosRegistroMayorista.nombreCompleto,
          telefono: datosRegistroMayorista.telefono,
          correo: datosRegistroMayorista.correo || 'No proporcionado',
          usuario: usuarioGen,
          password: passGen,
          estado: 'Pendiente',
          precios_gramo: { Pulseras: 36, Anillos: 36, Cadenas: 36, Aretes: 36, Gargantillas: 36, Dijes: 36 }
        }
      ]);

    if (error) {
      alert('Error de Supabase al registrar solicitud: ' + error.message);
      return;
    }

    setSolicitudEnviada(true);
  };

  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const productosSimilares = productoSeleccionadoModal 
    ? productos.filter(p => p.id !== productoSeleccionadoModal.id)
    : [];

  return (
    <div className="min-h-screen bg-[#faf7f2] text-zinc-900 font-sans selection:bg-amber-100 flex flex-col justify-between">
      
      <div>
        <div className="bg-[#f2ece1] text-amber-950 text-[11px] font-semibold py-1.5 border-b border-amber-200/60 px-4 flex justify-between items-center max-w-7xl mx-auto">
          <span className="tracking-widest uppercase text-center flex-1">{textoBarraAviso}</span>
          <div className="flex gap-3 items-center">
            <button 
              onClick={() => setVistaActual('historial')} 
              className="font-mono text-[10px] bg-zinc-900 hover:bg-amber-800 text-amber-300 hover:text-white px-2.5 py-0.5 rounded uppercase tracking-wider transition font-bold"
            >
              📦 Mis Pedidos ({misPedidos.length})
            </button>
            {esMayorista ? (
              <div className="flex items-center space-x-2 bg-amber-800 text-white px-3 py-0.5 rounded text-[10px] font-mono">
                <span>👑 Mayorista: <strong>{clienteMayoristaActivo?.nombre}</strong></span>
                <button onClick={cerrarSesionMayorista} className="underline hover:text-amber-200 ml-1">Salir</button>
              </div>
            ) : (
              <button 
                onClick={() => { setVistaActual('login'); setSolicitudEnviada(false); }} 
                className="hidden sm:inline-block font-mono text-[10px] bg-amber-800 hover:bg-amber-900 text-white px-2.5 py-0.5 rounded uppercase tracking-wider transition"
              >
                🔐 Iniciar Sesión Mayoristas
              </button>
            )}
          </div>
        </div>

        <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#ebd9c1] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setVistaActual('inicio'); setCategoriaFiltro('Todas'); }}>
              <div className="w-10 h-10 bg-[#f7f2e7] text-amber-700 font-serif font-black text-xl flex items-center justify-center rounded-lg border border-amber-300">
                AG
              </div>
              <div>
                <span className="font-serif font-bold text-2xl tracking-tight text-zinc-900 block leading-none">AG47</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                  {esMayorista ? 'Portal Mayorista B2B' : 'Distribuidor de Platería'}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-zinc-700">
              <button onClick={() => setVistaActual('inicio')} className={`transition ${vistaActual === 'inicio' ? 'text-amber-800 border-b-2 border-amber-700 pb-1' : 'hover:text-amber-700'}`}>Inicio</button>
              <button onClick={() => setVistaActual('categorias')} className={`transition ${vistaActual === 'categorias' ? 'text-amber-800 border-b-2 border-amber-700 pb-1' : 'hover:text-amber-700'}`}>Categorías</button>
              <button onClick={() => { setVistaActual('catalogo'); setCategoriaFiltro('Todas'); }} className={`transition ${vistaActual === 'catalogo' ? 'text-amber-800 border-b-2 border-amber-700 pb-1' : 'hover:text-amber-700'}`}>Catálogo</button>
              <button onClick={() => setVistaActual('historial')} className={`transition ${vistaActual === 'historial' ? 'text-amber-800 border-b-2 border-amber-700 pb-1' : 'hover:text-amber-700'}`}>Mis Pedidos</button>
              {!esMayorista && (
                <button onClick={() => { setVistaActual('login'); setSolicitudEnviada(false); }} className={`transition ${vistaActual === 'login' || vistaActual === 'registro_mayorista' ? 'text-amber-800 border-b-2 border-amber-700 pb-1' : 'hover:text-amber-800'}`}>Iniciar Sesión</button>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  value={busqueda} 
                  onChange={(e) => { setBusqueda(e.target.value); setVistaActual('catalogo'); }}
                  className="w-48 lg:w-64 pl-3 pr-8 py-1.5 bg-[#f5efe4] border border-[#e5d9c5] rounded-md text-xs focus:outline-none focus:border-amber-600 transition"
                />
                <span className="absolute right-2.5 top-1.5 text-amber-800/60 text-xs">🔍</span>
              </div>

              <button 
                onClick={() => setVistaActual('carrito')} 
                className="relative p-2 bg-zinc-900 text-amber-400 hover:bg-zinc-800 rounded-md transition font-bold text-xs flex items-center space-x-2 border border-amber-500/40"
              >
                <svg className="w-4 h-4 fill-current text-amber-400" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 00-8 0H4v14a2 2 0 002 2h12a2 2 0 002-2V7h-4zm-6-3a2 2 0 014 0v3h-4V4zm8 17H6V9h2v2a1 1 0 002 0V9h4v2a1 1 0 002 0V9h2v12z"/>
                </svg>
                <span className="hidden sm:inline text-white">Q{totalMonto.toFixed(2)}</span>
                <span className="bg-amber-600 text-white font-bold rounded-full px-1.5 py-0.2 text-[10px]">{totalPiezas}</span>
              </button>
            </div>
          </div>
        </header>

        {vistaActual === 'inicio' && (
          <>
            <section className="relative bg-[#f5efe6] text-zinc-900 overflow-hidden py-16 md:py-24 border-b border-[#e5d8c3]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl space-y-6 text-center md:text-left">
                  <span className="inline-block px-3.5 py-1 bg-[#eadcc7] text-amber-900 text-xs font-semibold rounded-full border border-amber-300 uppercase tracking-widest">
                    Colección Plata Ley 925
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 tracking-wide leading-tight">
                    Distribuidor de <span className="font-semibold text-amber-700 italic">Platería Fina</span>
                  </h1>
                  <p className="text-zinc-600 text-sm font-light leading-relaxed">
                    {esMayorista 
                      ? `Bienvenido/a ${clienteMayoristaActivo?.nombre}. Tu tarifario preferencial por gramo se encuentra activo en todas las joyas.`
                      : infoAdmin.nosotrosTexto
                    }
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button onClick={() => setVistaActual('categorias')} className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-8 py-3 rounded-md text-xs uppercase tracking-wider transition shadow-md">
                      Ver Categorías
                    </button>
                    <button onClick={() => { setVistaActual('catalogo'); setCategoriaFiltro('Todas'); }} className="bg-white hover:bg-[#f2ece1] text-zinc-900 font-bold px-8 py-3 rounded-md text-xs uppercase tracking-wider border border-amber-300 transition">
                      Ver Catálogo Completo
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-white p-4 flex items-center justify-center border-2 border-amber-200/80 shadow-xl">
                    <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800" alt="Joyería AG47" className="w-full h-full object-cover rounded-full shadow-inner border border-amber-100" />
                  </div>
                </div>
              </div>
            </section>

            <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8 border-b border-[#ebd9c1] pb-4">
                <h2 className="text-2xl font-serif uppercase tracking-widest text-zinc-900 font-bold">Categorías</h2>
                <button onClick={() => setVistaActual('categorias')} className="text-amber-800 font-bold text-xs uppercase hover:underline">Ver Todas →</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {todasLasCategorias.slice(0, 6).map((cat) => (
                  <div key={cat.id} onClick={() => irACategoriaEspecifica(cat.nombre)} className="group bg-white p-3 rounded-xl border border-[#eadecd] hover:border-amber-500 cursor-pointer text-center transition">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-[#f7f2e8]">
                      <img src={cat.foto} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <h3 className="font-serif font-bold text-xs uppercase text-zinc-800 group-hover:text-amber-700">{cat.nombre}</h3>
                  </div>
                ))}
              </div>
            </section>

            <section className="py-12 bg-white border-t border-[#ebd9c1]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-8 border-b border-[#ebd9c1] pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-800 font-bold">Colección Reciente</span>
                    <h2 className="text-2xl font-serif uppercase tracking-widest text-zinc-900 font-bold">Nuevos Ingresos</h2>
                  </div>
                  <button onClick={() => { setVistaActual('catalogo'); setCategoriaFiltro('Todas'); }} className="text-amber-800 font-bold text-xs uppercase hover:underline">Ver Todo el Catálogo →</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {productos.map((prod) => {
                    const precioAMostrar = obtenerPrecioCalculado(prod, prod.variantes[0]);
                    const pesoBase = prod.variantes[0]?.peso || 0;
                    const preciosGramoCliente = clienteMayoristaActivo?.precios_gramo || clienteMayoristaActivo?.preciosGramoPorCategoria || {};
                    const tarifaGramo = preciosGramoCliente[prod.categoria] || 36;
                    const stockTotal = calcularStockTotalProducto(prod);
                    const estaAgotadoTotal = stockTotal <= 0;

                    return (
                      <div key={prod.id} className={`bg-[#fcfaf7] rounded-xl border overflow-hidden flex flex-col justify-between transition shadow-xs cursor-pointer relative ${estaAgotadoTotal ? 'opacity-75 border-zinc-300' : 'border-[#ebdcc2] hover:border-amber-500'}`} onClick={() => abrirModalDetalle(prod)}>
                        <div>
                          <div className="relative aspect-square overflow-hidden bg-[#f3ece0]">
                            <img src={prod.fotos[0]} alt={prod.nombre} className={`w-full h-full object-cover transition duration-500 ${estaAgotadoTotal ? 'grayscale' : 'group-hover:scale-105'}`} />
                            
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              {prod.esNuevo && !estaAgotadoTotal && <span className="bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">Nuevo</span>}
                              {estaAgotadoTotal && <span className="bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-md">AGOTADO</span>}
                            </div>
                          </div>
                          <div className="p-4 space-y-1">
                            <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold">SKU: {prod.sku}</span>
                            <h3 className="font-serif font-bold text-xs text-zinc-900">{prod.nombre}</h3>
                          </div>
                        </div>

                        <div className="p-4 pt-0 flex items-center justify-between border-t border-[#f2e7d5] mt-2">
                          {esMayorista ? (
                            <div className="flex flex-col py-1">
                              <span className="text-[10px] text-zinc-500 font-mono">Peso: <strong>{pesoBase}g</strong></span>
                              <span className="text-[10px] text-emerald-800 font-mono font-semibold">Q{tarifaGramo}/g</span>
                              <span className="font-bold text-sm text-amber-900">Total: Q{precioAMostrar.toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-zinc-900">Q{precioAMostrar}.00</span>
                            </div>
                          )}
                          <button className={`font-bold text-xs px-3 py-1.5 rounded transition ${estaAgotadoTotal ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 hover:bg-amber-700 text-white'}`}>
                            {estaAgotadoTotal ? 'Agotado' : 'Ver Joya'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {vistaActual === 'historial' && (
          <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
            <div className="text-xs text-zinc-500 mb-4 font-serif">
              Inicio / <span className="text-amber-800 font-bold">Historial de Pedidos</span>
            </div>

            <h1 className="text-2xl font-serif uppercase tracking-wider font-bold text-zinc-900 mb-2">MIS PEDIDOS REALIZADOS</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">CONSULTA AQUÍ EL ESTADO ACTUAL DE TUS SOLICITUDES EN TIEMPO REAL</p>

            {misPedidos.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-[#e5d8c3] text-center space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Aún no has registrado ningún pedido en este navegador.</p>
                <button onClick={() => setVistaActual('catalogo')} className="bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded uppercase">
                  Ver Catálogo de Joyería
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {misPedidos.map((ped) => (
                  <div key={ped.id} className="bg-white rounded-xl border border-[#e5d8c3] p-5 shadow-xs space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#f2e7d5] pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-900 text-sm">Pedido #{ped.id}</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-600 font-medium">{ped.cliente}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">Fecha de solicitud: {ped.fecha}</p>
                      </div>

                      <div>
                        <span className={`px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                          ped.estado === 'Pendiente de revisar' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          ped.estado === 'Por confirmar cambios' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          ped.estado === 'Revisado' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {ped.estado}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-zinc-700 uppercase text-[10px]">Artículos Solicitados:</p>
                      <div className="divide-y divide-zinc-100 bg-[#fcfaf7] rounded-lg p-3 border border-[#f0e6d6]">
                        {ped.items?.map((it: any, idx: number) => (
                          <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                            <span className="text-zinc-800 font-medium">• {it.nombre}</span>
                            <span className="font-mono text-zinc-600">Cant: {it.cantidadSolicitada}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {vistaActual === 'categorias' && (
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl border border-[#eadecd] shadow-xs mb-10 text-center">
              <h1 className="text-3xl font-serif font-bold text-zinc-900 uppercase tracking-wider">TODAS NUESTRAS CATEGORÍAS</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {todasLasCategorias.map((cat) => (
                <div key={cat.id} onClick={() => irACategoriaEspecifica(cat.nombre)} className="group bg-white rounded-2xl border border-[#eadecd] overflow-hidden cursor-pointer hover:border-amber-500 transition shadow-xs">
                  <div className="aspect-4/3 overflow-hidden bg-[#f7f2e8]">
                    <img src={cat.foto} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-serif font-bold text-base text-zinc-900 uppercase tracking-wider group-hover:text-amber-800">{cat.nombre}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {vistaActual === 'catalogo' && (
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#ebd9c1] pb-6 gap-4">
              <div>
                <span className="text-xs font-mono text-amber-800 uppercase font-bold">Catálogo de Joyería</span>
                <h2 className="text-2xl font-serif uppercase tracking-widest text-zinc-900 font-bold">{categoriaFiltro === 'Todas' ? 'Todos los Productos' : `Categoría: ${categoriaFiltro}`}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCategoriaFiltro('Todas')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${categoriaFiltro === 'Todas' ? 'bg-amber-800 text-white' : 'bg-[#f4ebd9] text-zinc-700'}`}>Todas</button>
                {todasLasCategorias.map((c) => (
                  <button key={c.id} onClick={() => setCategoriaFiltro(c.nombre)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${categoriaFiltro === c.nombre ? 'bg-amber-800 text-white' : 'bg-[#f4ebd9] text-zinc-700'}`}>{c.nombre}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {productosFiltrados.map((prod) => {
                const precioAMostrar = obtenerPrecioCalculado(prod, prod.variantes[0]);
                const pesoBase = prod.variantes[0]?.peso || 0;
                const preciosGramoCliente = clienteMayoristaActivo?.precios_gramo || clienteMayoristaActivo?.preciosGramoPorCategoria || {};
                const tarifaGramo = preciosGramoCliente[prod.categoria] || 36;
                const stockTotal = calcularStockTotalProducto(prod);
                const estaAgotadoTotal = stockTotal <= 0;

                return (
                  <div key={prod.id} className={`bg-[#fcfaf7] rounded-xl border overflow-hidden flex flex-col justify-between transition shadow-xs cursor-pointer relative ${estaAgotadoTotal ? 'opacity-75 border-zinc-300' : 'border-[#ebdcc2] hover:border-amber-500'}`} onClick={() => abrirModalDetalle(prod)}>
                    <div>
                      <div className="relative aspect-square overflow-hidden bg-[#f3ece0]">
                        <img src={prod.fotos[0]} alt={prod.nombre} className={`w-full h-full object-cover transition duration-500 ${estaAgotadoTotal ? 'grayscale' : 'group-hover:scale-105'}`} />
                        {estaAgotadoTotal && (
                          <span className="absolute top-3 left-3 bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-md">
                            AGOTADO
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold">SKU: {prod.sku}</span>
                        <h3 className="font-serif font-bold text-xs text-zinc-900">{prod.nombre}</h3>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-[#f2e7d5] mt-2">
                      {esMayorista ? (
                        <div className="flex flex-col py-1">
                          <span className="text-[10px] text-zinc-500 font-mono">Peso: <strong>{pesoBase}g</strong></span>
                          <span className="text-[10px] text-emerald-800 font-mono font-semibold">Q{tarifaGramo}/g</span>
                          <span className="font-bold text-sm text-amber-900">Total: Q{precioAMostrar.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-900">Q{precioAMostrar}.00</span>
                        </div>
                      )}
                      <button className={`font-bold text-xs px-3 py-1.5 rounded transition ${estaAgotadoTotal ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 hover:bg-amber-700 text-white'}`}>
                        {estaAgotadoTotal ? 'Agotado' : 'Ver Joya'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {vistaActual === 'carrito' && (
          <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
            <div className="text-xs text-zinc-500 mb-4 font-serif">
              Inicio / <span className="text-amber-800 font-bold">Carrito</span>
            </div>

            <h1 className="text-2xl font-serif uppercase tracking-wider font-bold text-zinc-900 mb-2">CARRITO DE COMPRA</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">PARA CONTINUAR CON EL PEDIDO HAGA CLIC EN EL BOTÓN "SIGUIENTE"</p>

            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setVistaActual('revision')}
                disabled={carrito.length === 0}
                className="bg-zinc-200 hover:bg-amber-700 hover:text-white text-zinc-800 text-xs uppercase font-bold px-8 py-2.5 rounded transition disabled:opacity-50"
              >
                SIGUIENTE →
              </button>
            </div>

            <div className="bg-white rounded-lg border border-[#e5d8c3] overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#f2ece1] border-b border-[#e5d8c3] text-zinc-600 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">N°</th>
                    <th className="py-3 px-4">ITEMS</th>
                    <th className="py-3 px-4 text-center">PZ</th>
                    <th className="py-3 px-4 text-center">CANT</th>
                    <th className="py-3 px-4 text-right">TOTAL</th>
                    <th className="py-3 px-4 text-center">i</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2e7d5]">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 uppercase tracking-wider">Tu carrito está vacío actualmente</td>
                    </tr>
                  ) : (
                    carrito.map((item, index) => (
                      <tr key={item.id} className="hover:bg-[#fcfaf7]">
                        <td className="py-4 px-4 text-center font-bold text-zinc-400">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div 
                            onClick={() => verProductoDesdeCarrito(item.productoId)}
                            className="flex items-center space-x-3 cursor-pointer group"
                            title="Haz clic para ver el producto"
                          >
                            <img src={item.foto} alt={item.nombre} className="w-12 h-12 object-cover rounded bg-zinc-100 group-hover:opacity-80 transition" />
                            <div>
                              <p className="font-bold text-zinc-900 group-hover:text-amber-800 transition">{item.nombre} | Talla: {item.medida}</p>
                              <span className="text-[10px] font-mono text-zinc-400">
                                SKU: {item.sku} {esMayorista && `| Peso: ${item.pesoUnitario}g`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-medium">Q{item.precio.toFixed(2)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center border border-[#e5d8c3] rounded bg-white">
                            <button onClick={() => modificarCantidad(item.id, -1)} className="px-2 py-1 text-zinc-600 hover:bg-zinc-100 font-bold">◀</button>
                            <span className="px-3 font-mono font-bold text-zinc-800">{item.cantidad}</span>
                            <button onClick={() => modificarCantidad(item.id, 1)} className="px-2 py-1 text-zinc-600 hover:bg-zinc-100 font-bold">▶</button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-zinc-900">Q{(item.precio * item.cantidad).toFixed(2)}</td>
                        <td className="py-4 px-4 text-center">
                          <button onClick={() => eliminarDelCarrito(item.id)} className="text-zinc-400 hover:text-rose-600 text-xs font-bold uppercase">✕ Quitar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {carrito.length > 0 && (
              <div className="mt-8 space-y-6">
                <div className="flex justify-center items-center space-x-12 text-lg font-serif">
                  <span className="text-zinc-600">Total pedido</span>
                  <span className="font-bold text-zinc-800">{totalPiezas} piezas</span>
                  <span className="font-bold text-amber-800 text-2xl">Q{totalMonto.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button onClick={vaciarCarrito} className="bg-zinc-100 border border-zinc-300 text-zinc-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold px-6 py-2.5 rounded uppercase tracking-wider transition">
                    BORRAR CARRITO
                  </button>
                  <button onClick={() => setVistaActual('revision')} className="bg-zinc-200 hover:bg-amber-700 hover:text-white text-zinc-800 text-xs uppercase font-bold px-8 py-2.5 rounded transition">
                    SIGUIENTE →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {vistaActual === 'login' && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex justify-center items-center min-h-[65vh]">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-[#eadecd] shadow-xl space-y-6">
              
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 uppercase tracking-wide">
                  INICIAR SESIÓN
                </h1>
                <p className="text-xs text-zinc-500 font-light leading-relaxed">
                  Ingresa tus credenciales autorizadas para consultar el tarifario por gramo y realizar pedidos al por mayor.
                </p>
              </div>

              <form onSubmit={ejecutarLoginMayorista} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[11px]">
                    USUARIO O CORREO ELECTRÓNICO *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="ejemplo@joyeria.com o tu usuario"
                    value={loginUsuario}
                    onChange={(e) => setLoginUsuario(e.target.value)}
                    className="w-full p-3 bg-[#fcfaf7] border border-[#e5d8c3] rounded-lg text-xs focus:outline-none focus:border-amber-600 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                      CONTRASEÑA *
                    </label>
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 bg-[#fcfaf7] border border-[#e5d8c3] rounded-lg text-xs focus:outline-none focus:border-amber-600 transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-zinc-600">
                    <input 
                      type="checkbox" 
                      checked={loginRecordar}
                      onChange={(e) => setLoginRecordar(e.target.checked)}
                      className="rounded border-amber-300 text-amber-700"
                    />
                    <span>Recordar mi sesión</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={cargandoLogin}
                  className="w-full bg-zinc-900 hover:bg-amber-800 text-amber-400 hover:text-white font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition shadow-md flex items-center justify-center space-x-2 border border-amber-500/30"
                >
                  {cargandoLogin ? (
                    <span>Verificando...</span>
                  ) : (
                    <span>INGRESAR AL PORTAL MAYORISTA →</span>
                  )}
                </button>
              </form>

              <div className="border-t border-[#eadcc7] pt-6 text-center space-y-3">
                <p className="text-xs text-zinc-600">
                  ¿Aún no tienes una cuenta de cliente mayorista?
                </p>
                <button 
                  type="button"
                  onClick={() => setVistaActual('registro_mayorista')}
                  className="w-full bg-[#f4ebd9] hover:bg-[#eae0cb] text-amber-950 font-bold py-3 rounded-lg text-xs uppercase tracking-wider border border-amber-300 transition"
                >
                  SOLICITAR REGISTRO MAYORISTA
                </button>
              </div>

            </div>
          </section>
        )}

        {vistaActual === 'registro_mayorista' && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex justify-center items-center min-h-[65vh]">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-[#eadecd] shadow-xl space-y-6">
              
              {!solicitudEnviada ? (
                <>
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-serif font-bold text-zinc-900 uppercase tracking-wide">
                      SOLICITUD DE REGISTRO MAYORISTA
                    </h1>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed">
                      Ingresa tus datos para autorizar tu acceso al tarifario preferencial por gramo.
                    </p>
                  </div>

                  <form onSubmit={enviarRegistroMayorista} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[11px]">
                        Nombre Completo *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Juan Pérez"
                        value={datosRegistroMayorista.nombreCompleto}
                        onChange={(e) => setDatosRegistroMayorista({ ...datosRegistroMayorista, nombreCompleto: e.target.value })}
                        className="w-full p-3 bg-[#fcfaf7] border border-[#e5d8c3] rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[11px]">
                        Teléfono / WhatsApp *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. 5555-0000"
                        value={datosRegistroMayorista.telefono}
                        onChange={(e) => setDatosRegistroMayorista({ ...datosRegistroMayorista, telefono: e.target.value })}
                        className="w-full p-3 bg-[#fcfaf7] border border-[#e5d8c3] rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[11px]">
                        Correo Electrónico (Opcional)
                      </label>
                      <input 
                        type="email" 
                        placeholder="contacto@ejemplo.com"
                        value={datosRegistroMayorista.correo}
                        onChange={(e) => setDatosRegistroMayorista({ ...datosRegistroMayorista, correo: e.target.value })}
                        className="w-full p-3 bg-[#fcfaf7] border border-[#e5d8c3] rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3.5 rounded-lg text-xs uppercase tracking-wider transition shadow-md mt-2"
                    >
                      SOLICITAR ACCESO MAYORISTA
                    </button>

                    <button 
                      type="button"
                      onClick={() => setVistaActual('login')}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 underline block pt-1"
                    >
                      ← Regresar a Iniciar Sesión
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900 uppercase">
                    ¡Solicitud Recibida!
                  </h2>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    Gracias <strong className="text-zinc-900">{datosRegistroMayorista.nombreCompleto}</strong>. Tu cuenta ha sido registrada y enviada al panel de administración para su autorización.
                  </p>
                  <div className="pt-4">
                    <button 
                      onClick={() => { setVistaActual('login'); setSolicitudEnviada(false); }}
                      className="bg-zinc-900 text-white font-bold py-3 px-8 rounded-lg text-xs uppercase tracking-wider hover:bg-zinc-800 transition"
                    >
                      Volver a Iniciar Sesión
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {vistaActual === 'revision' && (
          <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
            <div className="text-xs text-zinc-500 mb-4 font-serif">
              Inicio / Mi cuenta / <span className="text-amber-800 font-bold">Revisión de orden y Envío</span>
            </div>

            <h1 className="text-2xl font-serif uppercase tracking-wider font-bold text-zinc-900 mb-1">DATOS DE ENVÍO Y REVISIÓN</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-8">COMPLETA TUS DATOS DE ENTREGA PARA ENVIAR TU PEDIDO A REVISIÓN</p>

            <form onSubmit={procesarHacerPedido} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-[#e5d8c3] space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-[#f2e7d5] pb-2">1. DATOS DEL CLIENTE</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Nombre Completo *</label>
                      <input type="text" required placeholder="Ej. María López" value={datosEnvio.nombreCompleto} onChange={(e) => setDatosEnvio({ ...datosEnvio, nombreCompleto: e.target.value })} className="w-full p-2.5 bg-[#fcfaf7] border border-[#e5d8c3] rounded" />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Teléfono / WhatsApp *</label>
                      <input type="text" required placeholder="Ej. 5555-0000" value={datosEnvio.telefono} onChange={(e) => setDatosEnvio({ ...datosEnvio, telefono: e.target.value })} className="w-full p-2.5 bg-[#fcfaf7] border border-[#e5d8c3] rounded" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-[#e5d8c3] space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-[#f2e7d5] pb-2">2. MÉTODO DE ENTREGA</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`p-4 rounded-lg border text-xs cursor-pointer flex items-start space-x-3 transition ${datosEnvio.metodoEntrega === 'envio' ? 'border-amber-600 bg-[#f2e6d3]/40 font-bold' : 'border-[#e5d8c3] bg-[#fcfaf7]'}`}>
                      <input type="radio" name="entrega" checked={datosEnvio.metodoEntrega === 'envio'} onChange={() => setDatosEnvio({ ...datosEnvio, metodoEntrega: 'envio' })} />
                      <div>
                        <span className="block text-zinc-900">🚚 Envío a Domicilio</span>
                        <span className="text-[11px] text-zinc-500 font-normal">Entrega por mensajería.</span>
                      </div>
                    </label>
                    <label className={`p-4 rounded-lg border text-xs cursor-pointer flex items-start space-x-3 transition ${datosEnvio.metodoEntrega === 'tienda' ? 'border-amber-600 bg-[#f2e6d3]/40 font-bold' : 'border-[#e5d8c3] bg-[#fcfaf7]'}`}>
                      <input type="radio" name="entrega" checked={datosEnvio.metodoEntrega === 'tienda'} onChange={() => setDatosEnvio({ ...datosEnvio, metodoEntrega: 'tienda' })} />
                      <div>
                        <span className="block text-zinc-900">🏬 Recoger en Tienda</span>
                        <span className="text-[11px] text-zinc-500 font-normal">En nuestra sala de ventas.</span>
                      </div>
                    </label>
                  </div>

                  {datosEnvio.metodoEntrega === 'envio' && (
                    <div className="pt-2 text-xs">
                      <label className="block font-bold text-zinc-700 mb-1">Dirección Exacta de Entrega *</label>
                      <input type="text" required={datosEnvio.metodoEntrega === 'envio'} placeholder="Calle, avenida, zona" value={datosEnvio.direccion} onChange={(e) => setDatosEnvio({ ...datosEnvio, direccion: e.target.value })} className="w-full p-2.5 bg-[#fcfaf7] border border-[#e5d8c3] rounded" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-l-amber-600 border border-[#e5d8c3] space-y-6 h-fit shadow-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">RESUMEN DE LA SOLICITUD</h2>
                <div className="flex justify-between text-base pt-2 font-bold text-zinc-900">
                  <span>Total orden:</span>
                  <span className="text-amber-800">Q{totalMonto.toFixed(2)}</span>
                </div>
                <button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3.5 rounded text-xs uppercase tracking-wider transition shadow-md">
                  HACER PEDIDO
                </button>
              </div>
            </form>
          </section>
        )}

        {vistaActual === 'confirmado' && (
          <section className="py-16 max-w-3xl mx-auto px-4 text-center min-h-[65vh] flex items-center justify-center">
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-[#eadecd] shadow-xl space-y-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 uppercase">¡Tu pedido se encuentra en revisión!</h1>
              <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
                Orden <strong className="font-mono text-zinc-900">#{numeroOrdenGenerado}</strong> recibida y enviada al panel de administración.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setVistaActual('historial')} className="bg-amber-700 text-white font-bold py-3 px-6 rounded text-xs uppercase">
                  Ver Historial de Mis Pedidos
                </button>
                <button onClick={enviarConfirmacionCliente} className="bg-zinc-900 text-white font-bold py-3 px-6 rounded text-xs uppercase">
                  Abrir WhatsApp con mi Pedido
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {productoSeleccionadoModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 sm:p-8 space-y-8 shadow-2xl border border-amber-200 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setProductoSeleccionadoModal(null)} className="absolute top-4 right-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold w-8 h-8 rounded-full flex items-center justify-center z-10">✕</button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              <div className="space-y-3">
                <div className="aspect-square bg-white rounded-xl overflow-hidden border border-zinc-200">
                  <img src={productoSeleccionadoModal.fotos[fotoActivaIndex] || productoSeleccionadoModal.fotos[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {productoSeleccionadoModal.fotos.map((foto: string, idx: number) => (
                    <button key={idx} onClick={() => setFotoActivaIndex(idx)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${fotoActivaIndex === idx ? 'border-amber-600' : 'border-zinc-200'}`}>
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h2 className="font-serif font-bold text-2xl text-zinc-900">{productoSeleccionadoModal.nombre}</h2>
                  <p className="text-zinc-500 text-xs mt-1">{productoSeleccionadoModal.descripcion}</p>
                </div>

                <div className="space-y-1 text-zinc-500 font-mono text-[11px]">
                  <p><strong className="text-zinc-700">ID:</strong> {productoSeleccionadoModal.sku}</p>
                  <p><strong className="text-zinc-700">Material:</strong> {productoSeleccionadoModal.material}</p>
                </div>

                {esMayorista && clienteMayoristaActivo ? (() => {
                  const preciosGramoModal = clienteMayoristaActivo.precios_gramo || clienteMayoristaActivo.preciosGramoPorCategoria || {};
                  const tarifaActualModal = preciosGramoModal[productoSeleccionadoModal.categoria] || 36;
                  return (
                    <div className="bg-[#fcfaf7] border border-amber-300/80 p-3.5 rounded-xl space-y-1">
                      <div className="flex justify-between text-zinc-600">
                        <span>Peso pieza:</span>
                        <strong className="font-mono text-zinc-800">{varianteElegida?.peso || 0} g</strong>
                      </div>
                      <div className="flex justify-between text-zinc-600">
                        <span>Precio por gramo asignado:</span>
                        <strong className="font-mono text-emerald-800">Q{tarifaActualModal.toFixed(2)} /g</strong>
                      </div>
                      <div className="border-t border-amber-200/60 pt-2 flex justify-between items-baseline">
                        <span className="font-bold text-zinc-700">Precio Total Pieza:</span>
                        <span className="font-serif font-bold text-2xl text-amber-900">
                          Q{obtenerPrecioCalculado(productoSeleccionadoModal, varianteElegida).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="pt-2">
                    <span className="font-serif font-bold text-3xl text-zinc-900">Q{productoSeleccionadoModal.precioMinorista}.00</span>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-200 space-y-4">
                  <p className="text-zinc-600 font-semibold">Seleccione una talla y cantidad:</p>
                  
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-zinc-700 w-20">Tallas (us)</span>
                    <div className="flex flex-wrap gap-2">
                      {productoSeleccionadoModal.variantes.map((v: any) => {
                        const sinStock = (v.stock || 0) <= 0;
                        return (
                          <button
                            key={v.id}
                            disabled={sinStock}
                            onClick={() => setVarianteElegida(v)}
                            className={`px-3 py-1.5 border rounded font-bold transition flex items-center justify-center text-xs ${
                              sinStock ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed' :
                              varianteElegida?.id === v.id ? 'border-amber-700 bg-amber-50 text-amber-900 font-extrabold ring-2 ring-amber-600/30' : 'border-zinc-300 text-zinc-700 hover:border-zinc-400'
                            }`}
                          >
                            {v.medida} {sinStock && '(Agotado)'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {varianteElegida && (
                    <p className="text-[11px] font-mono text-zinc-500">
                      Disponibles en inventario: <strong className={varianteElegida.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}>{varianteElegida.stock || 0} unidades</strong>
                    </p>
                  )}

                  {estaEnCarrito(productoSeleccionadoModal.id, varianteElegida?.id) && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center space-x-2">
                      <span>✓</span>
                      <span>Esta talla ya se encuentra agregada en tu carrito de compras.</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 pt-2">
                    <span className="font-bold text-zinc-700 w-20">Cantidad</span>
                    <div className="inline-flex items-center border border-zinc-300 rounded bg-zinc-50">
                      <button onClick={() => setCantidadModal(Math.max(1, cantidadModal - 1))} className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-200 font-bold">◀</button>
                      <span className="px-4 font-bold text-zinc-800">{cantidadModal}</span>
                      <button onClick={() => setCantidadModal(cantidadModal + 1)} className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-200 font-bold">▶</button>
                    </div>

                    <button 
                      onClick={agregarAlCarritoSilencioso} 
                      disabled={!varianteElegida || (varianteElegida.stock || 0) <= 0}
                      className="flex-1 bg-[#eadcc7] hover:bg-amber-700 hover:text-white text-zinc-900 font-bold text-xs uppercase py-3 rounded tracking-wider transition border border-amber-300/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(!varianteElegida || (varianteElegida.stock || 0) <= 0) ? 'Talla Agotada' : 'AGREGAR A COMPRA'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-zinc-200 pt-6 space-y-4">
              <h3 className="font-serif font-bold text-sm uppercase text-zinc-900">También te podría gustar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {productosSimilares.slice(0, 3).map((prodSim) => (
                  <div key={prodSim.id} onClick={() => abrirModalDetalle(prodSim)} className="bg-white p-3 rounded-xl border border-zinc-200 cursor-pointer text-center">
                    <img src={prodSim.fotos[0]} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                    <p className="font-serif font-bold text-xs text-zinc-800 truncate">{prodSim.nombre}</p>
                    <p className="font-bold text-xs text-amber-800">Q{obtenerPrecioCalculado(prodSim, prodSim.variantes[0]).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#f0e6d6] text-zinc-800 py-12 border-t border-[#dfcfb9] text-xs mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-amber-900 uppercase tracking-widest text-sm">NOSOTROS</h4>
            <p className="text-zinc-600 leading-relaxed font-light">{infoAdmin.nosotrosTexto}</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-amber-900 uppercase tracking-widest text-sm">NAVEGACIÓN</h4>
            <ul className="space-y-2 font-light text-zinc-600">
              <li><button onClick={() => setVistaActual('inicio')} className="hover:text-amber-800">Inicio</button></li>
              <li><button onClick={() => setVistaActual('categorias')} className="hover:text-amber-800">Categorías</button></li>
              <li><button onClick={() => setVistaActual('catalogo')} className="hover:text-amber-800">Catálogo</button></li>
              <li><button onClick={() => setVistaActual('historial')} className="hover:text-amber-800">Mis Pedidos</button></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-amber-900 uppercase tracking-widest text-sm">MAYORISTAS</h4>
            <ul className="space-y-2 font-light text-zinc-600">
              <li><button onClick={() => { setVistaActual('login'); setSolicitudEnviada(false); }} className="hover:text-amber-800">Acceso Mayoristas / Tarifario Gramo</button></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-amber-900 uppercase tracking-widest text-sm">CONTACTO</h4>
            <ul className="space-y-2 font-light text-zinc-600">
              {infoAdmin.direcciones.map((d, idx) => <li key={idx}>📍 {d}</li>)}
              {infoAdmin.telefonos.map((t, idx) => <li key={idx}>📞 {t}</li>)}
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}
