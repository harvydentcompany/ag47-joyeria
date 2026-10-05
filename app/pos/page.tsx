'use client';
import { useState, useEffect } from 'react';

export default function PosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('pos_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Yaosalazar1986@') {
      localStorage.setItem('pos_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl shadow-lg w-96 border border-slate-800">
          <h2 className="text-2xl font-bold mb-6 text-center text-amber-400">Punto de Venta AG47</h2>
          {error && <p className="text-rose-500 text-sm mb-4 text-center font-medium">Contraseña incorrecta</p>}
          <input 
            type="password" 
            placeholder="Introduce tu contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-amber-500 text-slate-950 p-3 rounded-lg font-bold hover:bg-amber-400 transition"
          >
            Ingresar al POS
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-400">Sesión POS Segura</span>
        <button 
          onClick={() => {
            localStorage.removeItem('pos_auth');
            setIsAuthenticated(false);
          }}
          className="bg-rose-600 text-white px-3 py-1.5 rounded font-bold hover:bg-rose-500 transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <PosDashboard />
    </div>
  );
}

function PosDashboard() {
  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <h1 className="text-3xl font-bold text-amber-400 mb-4">Punto de Venta (POS)</h1>
      <p className="text-slate-400">Aquí se encuentra la interfaz de cobros y ventas rápidas de tu joyería.</p>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Base de Datos Simulada de Productos en Caja
const productosBase = [
  { id: 1, sku: 'PUL-001', nombre: 'Pulsera Lisa Plata 925', peso: 8.5, precioMinorista: 450, categoria: 'Pulseras', stock: 5 },
  { id: 2, sku: 'ANI-012', nombre: 'Anillo Garra Zirconia', peso: 3.2, precioMinorista: 220, categoria: 'Anillos', stock: 8 },
  { id: 3, sku: 'CAD-005', nombre: 'Cadena Escalera 50cm', peso: 12.0, precioMinorista: 650, categoria: 'Cadenas', stock: 3 },
  { id: 4, sku: 'ARE-008', nombre: 'Arete Arracada Mediana', peso: 4.1, precioMinorista: 280, categoria: 'Aretes', stock: 12 },
];

// Clientes B2B / VIP sincronizados con el panel de administración
const clientesVIP = [
  { 
    id: 'PUBLICO', 
    nombre: 'Cliente General (Minorista)', 
    telefono: '50200000000',
    tipo: 'b2c',
    tieneCredito: false,
    limiteCredito: 0,
    saldoDeuda: 0,
    diasCredito: 0
  },
  { 
    id: '101', 
    nombre: 'María López', 
    telefono: '50255550101',
    tipo: 'b2b', 
    tarifaGramo: 36,
    tieneCredito: true,
    limiteCredito: 5000,
    saldoDeuda: 1200,
    diasCredito: 30
  },
  { 
    id: '102', 
    nombre: 'Marta Gómez', 
    telefono: '50255550202',
    tipo: 'b2b', 
    tarifaGramo: 33,
    tieneCredito: false,
    limiteCredito: 0,
    saldoDeuda: 0,
    diasCredito: 0
  },
  { 
    id: '103', 
    nombre: 'Carlos Pérez', 
    telefono: '50255550303',
    tipo: 'b2b', 
    tarifaGramo: 35,
    tieneCredito: true,
    limiteCredito: 3000,
    saldoDeuda: 500,
    diasCredito: 15
  },
];

export default function PosPage() {
  const router = useRouter();
  const inputEscanerRef = useRef<HTMLInputElement>(null);

  // URL del logo de la empresa para impresión y pantalla
  const logoEmpresaUrl = 'https://via.placeholder.com/150/000000/FFFFFF?text=AG47+LOGO';

  // Estados del POS
  const [inventario, setInventario] = useState(productosBase);
  const [listaClientes] = useState(clientesVIP);
  const [busquedaProd, setBusquedaProd] = useState('');
  const [skuEscaner, setSkuEscaner] = useState('');
  
  // Estado para el buscador/desplegable de clientes
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clientesVIP[0]);
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

  const [carrito, setCarrito] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'credito'>('efectivo');
  const [montoPagaCon, setMontoPagaCon] = useState<number | ''>('');
  const [ticketEmitido, setTicketEmitido] = useState<any | null>(null);

  // Mantener el foco automático en la barra del escáner
  useEffect(() => {
    inputEscanerRef.current?.focus();
  }, []);

  // Clientes filtrados según la búsqueda rápida
  const clientesFiltrados = listaClientes.filter(c => 
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.telefono.includes(busquedaCliente)
  );

  // Calcular precio según el cliente seleccionado
  const obtenerPrecioItem = (prod: any) => {
    if (clienteSeleccionado.tipo === 'b2b') {
      const tarifa = clienteSeleccionado.tarifaGramo || 35;
      return prod.peso * tarifa;
    }
    return prod.precioMinorista;
  };

  // Agregar producto al carrito por SKU o clic
  const agregarAlCarrito = (prod: any) => {
    if (prod.stock <= 0) {
      alert('⚠️ Producto sin existencia en inventario');
      return;
    }

    const precioUnitario = obtenerPrecioItem(prod);
    const existeIndex = carrito.findIndex(item => item.id === prod.id);

    if (existeIndex > -1) {
      if (carrito[existeIndex].cantidad + 1 > prod.stock) {
        alert('⚠️ Cantidad supera el stock disponible');
        return;
      }
      const nuevoCarrito = [...carrito];
      nuevoCarrito[existeIndex].cantidad += 1;
      nuevoCarrito[existeIndex].subtotal = nuevoCarrito[existeIndex].cantidad * precioUnitario;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1, precioCalculado: precioUnitario, subtotal: precioUnitario }]);
    }
  };

  // Manejador de Escáner de Código de Barras
  const manejarEscaner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuEscaner.trim()) return;

    const productoEncontrado = inventario.find(
      p => p.sku.toLowerCase() === skuEscaner.trim().toLowerCase()
    );

    if (productoEncontrado) {
      agregarAlCarrito(productoEncontrado);
      setSkuEscaner('');
    } else {
      alert(`❌ Producto con SKU "${skuEscaner}" no fue encontrado`);
      setSkuEscaner('');
    }
  };

  // Modificar cantidades en carrito
  const cambiarCantidad = (id: number, delta: number) => {
    const nuevoCarrito = carrito.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + delta;
        if (nuevaCant <= 0) return null;
        if (nuevaCant > item.stock) {
          alert('⚠️ Supera el stock disponible');
          return item;
        }
        return { ...item, cantidad: nuevaCant, subtotal: nuevaCant * item.precioCalculado };
      }
      return item;
    }).filter(Boolean);

    setCarrito(nuevoCarrito);
  };

  // Totales
  const totalGramos = carrito.reduce((acc, item) => acc + (item.peso * item.cantidad), 0);
  const totalPagar = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const vueltoCalculado = typeof montoPagaCon === 'number' && montoPagaCon >= totalPagar ? montoPagaCon - totalPagar : 0;

  // Generar sugerencias de billetes y montos redondeados superiores para cobro en efectivo
  const obtenerSugerenciasEfectivo = (total: number) => {
    if (total <= 0) return [];

    const opcionesSet = new Set<number>();
    
    // 1. Exacto
    opcionesSet.add(total);

    // 2. Redondeo a los siguientes billetes
    const paso5 = Math.ceil(total / 5) * 5;
    if (paso5 > total) opcionesSet.add(paso5);

    const paso10 = Math.ceil(total / 10) * 10;
    if (paso10 > total) opcionesSet.add(paso10);

    const paso50 = Math.ceil(total / 50) * 50;
    if (paso50 > total) opcionesSet.add(paso50);

    const paso100 = Math.ceil(total / 100) * 100;
    if (paso100 > total) opcionesSet.add(paso100);

    const paso200 = Math.ceil(total / 200) * 200;
    if (paso200 > total) opcionesSet.add(paso200);

    return Array.from(opcionesSet).sort((a, b) => a - b).slice(0, 4);
  };

  // Cálculo de Crédito
  const disponibleCredito = clienteSeleccionado.tieneCredito 
    ? Math.max(0, clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoDeuda) 
    : 0;

  // Procesar Venta / Cobro
  const procesarVenta = () => {
    if (carrito.length === 0) return alert('El carrito está vacío');

    if (metodoPago === 'efectivo' && (typeof montoPagaCon !== 'number' || montoPagaCon < totalPagar)) {
      return alert('El monto pagado en efectivo es menor al total a cobrar');
    }

    if (metodoPago === 'credito') {
      if (!clienteSeleccionado.tieneCredito) {
        return alert('Este cliente no tiene línea de crédito autorizada.');
      }
      if (totalPagar > disponibleCredito) {
        return alert(`⚠️ La compra supera el crédito disponible (Q${disponibleCredito}).`);
      }
    }

    // Descontar Inventario
    const nuevoInventario = inventario.map(prod => {
      const itemEnCarrito = carrito.find(c => c.id === prod.id);
      if (itemEnCarrito) {
        return { ...prod, stock: prod.stock - itemEnCarrito.cantidad };
      }
      return prod;
    });
    setInventario(nuevoInventario);

    // Emisión de Ticket
    const ticket = {
      folio: `AG-${Math.floor(100000 + Math.random() * 900000)}`,
      fecha: new Date().toLocaleString(),
      cliente: clienteSeleccionado.nombre,
      telefonoCliente: clienteSeleccionado.telefono,
      items: carrito,
      totalGramos,
      totalPagar,
      metodoPago,
      pagaCon: montoPagaCon || totalPagar,
      vuelto: vueltoCalculado,
      diasPlazoCredito: clienteSeleccionado.diasCredito
    };

    setTicketEmitido(ticket);
    setCarrito([]);
    setMontoPagaCon('');
  };

  // Generar Enlace Directo para WhatsApp
  const enviarPorWhatsApp = () => {
    if (!ticketEmitido) return;

    let mensaje = `*AG47 JOYERÍA - COMPROBANTE DE COMPRA*\n`;
    mensaje += `*Folio:* ${ticketEmitido.folio}\n`;
    mensaje += `*Fecha:* ${ticketEmitido.fecha}\n`;
    mensaje += `*Cliente:* ${ticketEmitido.cliente}\n`;
    mensaje += `*Forma de Pago:* ${ticketEmitido.metodoPago.toUpperCase()}\n\n`;
    mensaje += `*DETALLE DE PIEZAS:*\n`;

    ticketEmitido.items.forEach((it: any) => {
      mensaje += `• ${it.nombre} (${it.cantidad}x) - Q${it.subtotal.toFixed(2)} (${it.peso}g)\n`;
    });

    mensaje += `\n*Peso Total Metal:* ${ticketEmitido.totalGramos.toFixed(1)}g\n`;
    mensaje += `*TOTAL PAGADO:* Q${ticketEmitido.totalPagar.toFixed(2)}\n\n`;
    mensaje += `¡Gracias por tu compra! ✨`;

    const url = `https://wa.me/${ticketEmitido.telefonoCliente}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* ESTILOS DE IMPRESIÓN ADAPTADOS CON LOGO */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seccion-impresion-ticket, #seccion-impresion-ticket * {
            visibility: visible;
          }
          #seccion-impresion-ticket {
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            width: 100%;
            max-width: 400px;
            padding: 20px;
            border: 1px solid #ccc;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>

      {/* ENCABEZADO DE CAJA POS */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center no-imprimir">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 font-serif font-black text-lg rounded-xl flex items-center justify-center">
            AG
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Terminal POS — Caja Chica Presencial
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">En Línea</span>
            </h1>
            <p className="text-xs text-slate-400">Atención en Mostrador & Ventas Rápidas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl transition font-mono"
          >
            ← Panel Admin
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl transition font-mono"
          >
            Cerrar Turno
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden no-imprimir">
        
        {/* COLUMNA IZQUIERDA: BÚSQUEDA Y CATÁLOGO DE CAJA */}
        <div className="lg:col-span-7 bg-slate-950 p-6 flex flex-col gap-4 border-r border-slate-800 overflow-y-auto">
          
          {/* BARRA DE ESCÁNER DE CÓDIGO DE BARRAS */}
          <form onSubmit={manejarEscaner} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex gap-3 shadow-inner">
            <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-amber-500 text-sm">📷</span>
              <input 
                ref={inputEscanerRef}
                type="text" 
                placeholder="Escanea con pistola de código o escribe SKU y presiona Enter..." 
                value={skuEscaner}
                onChange={(e) => setSkuEscaner(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 text-xs rounded-xl font-mono">
              Escanear SKU
            </button>
          </form>

          {/* CONTROLES: BÚSQUEDA DE PRODUCTO Y BUSCADOR DESPLEGABLE DE CLIENTES */}
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* BUSCADOR DE PRODUCTOS */}
            <input 
              type="text" 
              placeholder="🔍 Buscar producto por nombre o categoría..." 
              value={busquedaProd}
              onChange={(e) => setBusquedaProd(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />

            {/* SELECCIÓN DE CLIENTE ESTILO BUSCADOR DESPLEGABLE */}
            <div className="relative flex-1">
              <div 
                onClick={() => setMostrarDropdownCliente(!mostrarDropdownCliente)}
                className="bg-slate-900 border border-amber-500/50 p-2.5 rounded-xl text-xs font-bold text-amber-400 flex justify-between items-center cursor-pointer select-none"
              >
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Cliente Seleccionado:</span>
                  <span className="text-white font-bold">{clienteSeleccionado.nombre}</span>
                  {clienteSeleccionado.tipo === 'b2b' && (
                    <span className="text-amber-400 font-mono text-[10px] ml-1.5">(Q{clienteSeleccionado.tarifaGramo}/g)</span>
                  )}
                </div>
                <span className="text-slate-400 text-xs ml-2">{mostrarDropdownCliente ? '▲' : '▼'}</span>
              </div>

              {/* LISTA DESPLEGABLE BUSCABLE */}
              {mostrarDropdownCliente && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-2 max-h-60 overflow-y-auto">
                  <input 
                    type="text" 
                    placeholder="🔎 Escribe para buscar cliente..." 
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    autoFocus
                  />

                  <div className="space-y-1">
                    {clientesFiltrados.length === 0 ? (
                      <p className="text-[11px] text-slate-500 p-2 text-center font-mono">No se encontraron clientes</p>
                    ) : (
                      clientesFiltrados.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setClienteSeleccionado(c);
                            setMostrarDropdownCliente(false);
                            setBusquedaCliente('');
                            if (!c.tieneCredito && metodoPago === 'credito') {
                              setMetodoPago('efectivo');
                            }
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer text-xs transition flex justify-between items-center ${
                            clienteSeleccionado.id === c.id ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{c.nombre}</p>
                            <p className="text-[10px] opacity-70 font-mono">Tel: {c.telefono}</p>
                          </div>
                          {c.tipo === 'b2b' && (
                            <span className="text-[10px] font-mono bg-slate-950/40 px-2 py-0.5 rounded text-amber-300">
                              Q{c.tarifaGramo}/g
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* TARJETA DE ESTADO DE CRÉDITO DEL CLIENTE */}
          {clienteSeleccionado.tieneCredito && (
            <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-2xl flex justify-between items-center text-xs font-mono">
              <div>
                <p className="text-amber-400 font-bold">💳 Línea de Crédito Autorizada ({clienteSeleccionado.diasCredito} días)</p>
                <p className="text-slate-400 text-[11px]">
                  Límite: <span className="text-white font-bold">Q{clienteSeleccionado.limiteCredito}</span> | 
                  Deuda: <span className="text-rose-400 font-bold">Q{clienteSeleccionado.saldoDeuda}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Disponible:</p>
                <p className="text-sm font-black text-emerald-400">Q{disponibleCredito}</p>
              </div>
            </div>
          )}

          {/* GRID DE PRODUCTOS DISPONIBLES EN CAJA */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {inventario
              .filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) || p.categoria.toLowerCase().includes(busquedaProd.toLowerCase()))
              .map(prod => {
                const precioParaCliente = obtenerPrecioItem(prod);
                return (
                  <div 
                    key={prod.id}
                    onClick={() => agregarAlCarrito(prod)}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl cursor-pointer transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{prod.sku}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${prod.stock > 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          Stock: {prod.stock}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-1">{prod.nombre}</h3>
                      <p className="text-[10px] text-slate-400">Peso: {prod.peso}g | {prod.categoria}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-end">
                      <div>
                        {clienteSeleccionado.tipo === 'b2b' && (
                          <p className="text-[9px] text-amber-500 font-mono">{prod.peso}g × Q{clienteSeleccionado.tarifaGramo}/g</p>
                        )}
                        <p className="text-sm font-black text-emerald-400 font-mono">Q{precioParaCliente.toFixed(2)}</p>
                      </div>
                      <span className="w-6 h-6 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-bold text-xs shadow">
                        +
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

        </div>

        {/* COLUMNA DERECHA: CARRITO Y PANEL DE COBRO */}
        <div className="lg:col-span-5 bg-slate-900 p-6 flex flex-col justify-between border-l border-slate-800">
          
          {/* DETALLE DE ÍTEMS EN COBRO */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">🛒 Piezas a Facturar</h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                Items: {carrito.reduce((acc, i) => acc + i.cantidad, 0)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6">
                  <span className="text-3xl mb-2">💎</span>
                  <p className="text-xs">Escanea un código de barras o selecciona un producto para iniciar la venta</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Q{item.precioCalculado.toFixed(2)} c/u ({item.peso}g)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="w-5 h-5 bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center">
                        -
                      </button>
                      <span className="text-xs font-bold font-mono text-amber-400 px-1">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, 1)} className="w-5 h-5 bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center">
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <p className="text-xs font-bold text-emerald-400 font-mono">Q{item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RESUMEN DE COBRO Y MÉTODOS DE PAGO */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Peso Total Metal:</span>
                <span className="font-bold text-slate-200">{totalGramos.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between text-sm font-black text-emerald-400 pt-1.5 border-t border-slate-800">
                <span>TOTAL A COBRAR:</span>
                <span className="text-base">Q{totalPagar.toFixed(2)}</span>
              </div>
            </div>

            {/* SELECCIÓN DE MÉTODO DE PAGO */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Método de Pago:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button 
                  onClick={() => setMetodoPago('efectivo')}
                  className={`p-2 rounded-xl border transition text-center ${metodoPago === 'efectivo' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  💵 Efectivo
                </button>
                <button 
                  onClick={() => setMetodoPago('tarjeta')}
                  className={`p-2 rounded-xl border transition text-center ${metodoPago === 'tarjeta' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  💳 Tarjeta POS
                </button>
                <button 
                  onClick={() => setMetodoPago('transferencia')}
                  className={`p-2 rounded-xl border transition text-center ${metodoPago === 'transferencia' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  🏦 Depósito
                </button>
                <button 
                  onClick={() => {
                    if (!clienteSeleccionado.tieneCredito) {
                      alert('Este cliente no tiene línea de crédito autorizada.');
                      return;
                    }
                    setMetodoPago('credito');
                  }}
                  className={`p-2 rounded-xl border transition text-center ${metodoPago === 'credito' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  📝 Crédito B2B
                </button>
              </div>
            </div>

            {/* CONTROL DESTACADO DE PAGO Y CÁLCULO DE VUELTO/CAMBIO */}
            {metodoPago === 'efectivo' && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-amber-500/40">
                
                {/* INGRESO MANUAL DE PAGO RECIBIDO POR EL VENDEDOR */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-amber-400 font-bold font-mono uppercase">Efectivo Recibido (Vendedor):</label>
                    <span className="text-[10px] text-slate-500 font-mono">Ingresa el billete o monto exacto</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-lg font-black text-amber-500 font-mono">Q</span>
                    <input 
                      type="number" 
                      placeholder={totalPagar.toFixed(2)} 
                      value={montoPagaCon}
                      onChange={(e) => setMontoPagaCon(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-3 pl-8 bg-slate-900 border-2 border-amber-500/60 rounded-xl text-lg font-black font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* BOTONES INTELIGENTES DE VARIANTES / REDONDEO DE BILLETES */}
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-mono">Atajos de billetes recibidos:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {obtenerSugerenciasEfectivo(totalPagar).map((monto, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setMontoPagaCon(monto)}
                        className={`flex-1 min-w-[70px] border py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                          montoPagaCon === monto 
                            ? 'bg-amber-500 border-amber-400 text-slate-950' 
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
                        }`}
                      >
                        {monto === totalPagar ? `Exacto Q${monto}` : `Q${monto}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VISUALIZACIÓN DEL CAMBIO / VUELTO QUE DEBE DAR EL VENDEDOR */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase block">Cambio a Entregar:</span>
                    <span className="text-[10px] text-slate-500">Vuelto al cliente</span>
                  </div>
                  <span className={`text-xl font-black ${vueltoCalculado > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    Q{vueltoCalculado.toFixed(2)}
                  </span>
                </div>

              </div>
            )}

            {/* VISTA PREVIA DE PAGO A CRÉDITO */}
            {metodoPago === 'credito' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-xs font-mono space-y-1">
                <p className="text-amber-400 font-bold">Resumen de Cargo a Crédito:</p>
                <p className="text-slate-400 text-[10px]">Plazo de pago: <span className="text-white font-bold">{clienteSeleccionado.diasCredito} días</span></p>
                <p className="text-slate-400 text-[10px]">Disponible actual: <span className="text-emerald-400 font-bold">Q{disponibleCredito}</span></p>
                <p className="text-slate-400 text-[10px]">Disponible restante post-compra: <span className="text-amber-300 font-bold">Q{(disponibleCredito - totalPagar).toFixed(2)}</span></p>
              </div>
            )}

            {/* BOTÓN COBRAR */}
            <button 
              onClick={procesarVenta}
              disabled={carrito.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider font-mono transition shadow-lg shadow-emerald-500/20"
            >
              ✓ Finalizar Venta y Emitir Comprobante
            </button>

          </div>

        </div>

      </div>

      {/* MODAL TICKET / COMPROBANTE DE COMPRA */}
      {ticketEmitido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div id="seccion-impresion-ticket" className="bg-white text-slate-900 max-w-sm w-full p-6 rounded-2xl shadow-2xl font-mono text-xs space-y-4">
            
            {/* CABECERA CON LOGO IMPRESO */}
            <div className="text-center space-y-1.5 pb-3 border-b border-dashed border-slate-300">
              <img 
                src={logoEmpresaUrl} 
                alt="Logo AG47" 
                className="w-20 h-20 object-contain mx-auto mb-1"
              />
              <h2 className="text-base font-black font-serif tracking-widest text-slate-900">AG47 JOYERÍA</h2>
              <p className="text-[10px] text-slate-500">Comprobante de Venta Presencial</p>
              <p className="text-[10px] text-slate-500">Folio: <span className="font-bold text-slate-800">{ticketEmitido.folio}</span></p>
              <p className="text-[10px] text-slate-500">{ticketEmitido.fecha}</p>
            </div>

            <div className="text-[10px] text-slate-600 space-y-0.5">
              <p>Atendido a: <span className="font-bold text-slate-900">{ticketEmitido.cliente}</span></p>
              <p>Forma de Pago: <span className="font-bold uppercase text-slate-900">{ticketEmitido.metodoPago === 'credito' ? `Crédito (${ticketEmitido.diasPlazoCredito} días)` : ticketEmitido.metodoPago}</span></p>
            </div>

            <div className="space-y-1.5 py-2 border-y border-dashed border-slate-300">
              {ticketEmitido.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[10px]">
                  <div>
                    <p className="font-bold">{item.nombre}</p>
                    <p className="text-slate-500">{item.cantidad} x Q{item.precioCalculado.toFixed(2)} ({item.peso}g)</p>
                  </div>
                  <span className="font-bold">Q{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Peso Metal Total:</span>
                <span>{ticketEmitido.totalGramos.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>Q{ticketEmitido.totalPagar.toFixed(2)}</span>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN (IMPRIMIR Y ENVIAR POR WHATSAPP) */}
            <div className="pt-3 space-y-2 no-imprimir">
              <button 
                onClick={enviarPorWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition"
              >
                <span>📲 Enviar Ticket por WhatsApp</span>
              </button>

              <button 
                onClick={() => window.print()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition"
              >
                <span>🖨️ Imprimir Comprobante (Carta / Normal)</span>
              </button>

              <button 
                onClick={() => setTicketEmitido(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs font-mono transition"
              >
                Cerrar y Nueva Venta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
