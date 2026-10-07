'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

      <PosDashboardContent />
    </div>
  );
}

// Cliente base obligatorio (Minorista)
const clienteMinoristaBase = { 
  id: 'PUBLICO', 
  nombre: 'Cliente General (Minorista)', 
  telefono: '50200000000',
  tipo: 'b2c',
  tarifaGramo: 35,
  tieneCredito: false,
  limiteCredito: 0,
  saldoDeuda: 0,
  diasCredito: 0
};

function PosDashboardContent() {
  const router = useRouter();
  const inputEscanerRef = useRef<HTMLInputElement>(null);

  const logoEmpresaUrl = 'https://via.placeholder.com/150/000000/FFFFFF?text=AG47+LOGO';

  // 1. CARGADOR INTELIGENTE DE INVENTARIO (BUSCA EN TODAS LAS LLAVES DEL ADMIN)
  const cargarInventarioAdmin = () => {
    if (typeof window === 'undefined') return [];

    const llavesInventario = ['ag47_inventario_admin', 'ag47_productos', 'productos_ag47'];
    for (const llave of llavesInventario) {
      const guardados = localStorage.getItem(llave);
      if (guardados) {
        try {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Asegurar que cada producto tenga variantes válidas para el POS
            return parsed.map((p: any) => ({
              ...p,
              precioMinorista: Number(p.precioMinorista || p.precio || 0),
              variantes: p.variantes && p.variantes.length > 0 ? p.variantes : [{ medida: 'Única', peso: p.peso || 5, stock: p.stock || 10 }]
            }));
          }
        } catch(e) {}
      }
    }

    // Inventario por defecto si no hay registros
    return [
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
        ]
      }
    ];
  };

  const [inventario, setInventario] = useState(cargarInventarioAdmin);

  // Sincronización automática de inventario en tiempo real
  useEffect(() => {
    const sincronizarInventario = () => {
      setInventario(cargarInventarioAdmin());
    };

    window.addEventListener('storage', sincronizarInventario);
    const intervalo = setInterval(sincronizarInventario, 2000); // Polling activo cada 2 segundos

    return () => {
      window.removeEventListener('storage', sincronizarInventario);
      clearInterval(intervalo);
    };
  }, []);

  // Guardar cambios de inventario (cuando se vende algo) en localStorage para que el Admin lo reciba
  const guardarInventarioActualizado = (nuevoInventario: any[]) => {
    setInventario(nuevoInventario);
    localStorage.setItem('ag47_inventario_admin', JSON.stringify(nuevoInventario));
  };

  // 2. LISTA DE CLIENTES (CARGA DIRECTA DE SUPABASE + RESPALDO LOCAL)
  const [listaClientes, setListaClientes] = useState<any[]>([clienteMinoristaBase]);

  const cargarClientesPOS = async () => {
    const { data, error } = await supabase.from('mayoristas').select('*');
    
    if (!error && data && data.length > 0) {
      const mayoristasMapeados = data.map((item: any) => ({
        id: item.id || String(Math.random()),
        nombre: item.nombre || 'Sin nombre',
        telefono: item.telefono || '50200000000',
        tipo: 'b2b',
        tarifaGramo: Number(item.precios_gramo?.Anillos || 36),
        tieneCredito: Boolean(item.tiene_credito),
        limiteCredito: Number(item.limite_credito || 0),
        saldoDeuda: 0,
        diasCredito: Number(item.dias_credito || 15)
      }));
      setListaClientes([clienteMinoristaBase, ...mayoristasMapeados]);
      return;
    }

    if (typeof window !== 'undefined') {
      const guardados = localStorage.getItem('ag47_mayoristas_admin');
      if (guardados) {
        try {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mayoristasMapeados = parsed.map((m: any) => ({
              id: m.id || String(Math.random()),
              nombre: m.nombre || 'Sin Nombre',
              telefono: m.telefono || '50200000000',
              tipo: 'b2b',
              tarifaGramo: Number(m.preciosGramoPorCategoria?.Anillos || m.precios_gramo?.Anillos || 36),
              tieneCredito: Boolean(m.tieneCredito || m.tiene_credito),
              limiteCredito: Number(m.limiteCredito || m.limite_credito || 0),
              saldoDeuda: Number(m.saldoDeuda || m.saldo_deuda || 0),
              diasCredito: Number(m.diasCredito || m.dias_credito || 15)
            }));
            setListaClientes([clienteMinoristaBase, ...mayoristasMapeados]);
            return;
          }
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    cargarClientesPOS();
  }, []);

  const [busquedaProd, setBusquedaProd] = useState('');
  const [skuEscaner, setSkuEscaner] = useState('');
  
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clienteMinoristaBase);
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

  const [carrito, setCarrito] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'credito'>('efectivo');
  const [montoPagaCon, setMontoPagaCon] = useState<number | ''>('');
  const [ticketEmitido, setTicketEmitido] = useState<any | null>(null);

  useEffect(() => {
    inputEscanerRef.current?.focus();
  }, []);

  const clientesFiltrados = listaClientes.filter(c => 
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.telefono.includes(busquedaCliente)
  );

  const agregarAlCarrito = (prod: any, varianteIndex = 0) => {
    const variante = prod.variantes?.[varianteIndex] || { medida: 'Única', peso: 5, stock: prod.stock || 5 };
    
    if (variante.stock <= 0) {
      alert('⚠️ Producto o variante sin existencia en inventario');
      return;
    }

    const precioUnitario = clienteSeleccionado.tipo === 'b2b' 
      ? variante.peso * (clienteSeleccionado.tarifaGramo || 36) 
      : prod.precioMinorista;

    const itemIdUnico = `${prod.id}-${variante.medida}`;
    const existeIndex = carrito.findIndex(item => item.itemIdUnico === itemIdUnico);

    if (existeIndex > -1) {
      if (carrito[existeIndex].cantidad + 1 > variante.stock) {
        alert('⚠️ Cantidad supera el stock disponible de esta variante');
        return;
      }
      const nuevoCarrito = [...carrito];
      nuevoCarrito[existeIndex].cantidad += 1;
      nuevoCarrito[existeIndex].subtotal = nuevoCarrito[existeIndex].cantidad * precioUnitario;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, {
        itemIdUnico,
        productoId: prod.id,
        sku: prod.sku,
        nombre: `${prod.nombre} (${variante.medida})`,
        peso: variante.peso,
        precioCalculado: precioUnitario,
        cantidad: 1,
        subtotal: precioUnitario,
        medida: variante.medida
      }]);
    }
  };

  const manejarEscaner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuEscaner.trim()) return;

    const busq = skuEscaner.trim().toLowerCase();
    const productoEncontrado = inventario.find(
      (p: any) => p.sku.toLowerCase() === busq || (p.barcode && p.barcode.toLowerCase() === busq)
    );

    if (productoEncontrado) {
      agregarAlCarrito(productoEncontrado, 0);
      setSkuEscaner('');
    } else {
      alert(`❌ Producto con SKU o código "${skuEscaner}" no fue encontrado`);
      setSkuEscaner('');
    }
  };

  const cambiarCantidad = (itemIdUnico: string, delta: number) => {
    const nuevoCarrito = carrito.map(item => {
      if (item.itemIdUnico === itemIdUnico) {
        const nuevaCant = item.cantidad + delta;
        if (nuevaCant <= 0) return null;
        
        const prodOriginal = inventario.find((p: any) => p.id === item.productoId);
        const varOriginal = prodOriginal?.variantes?.find((v: any) => v.medida === item.medida);
        const stockMax = varOriginal ? varOriginal.stock : 10;

        if (nuevaCant > stockMax) {
          alert('⚠️ Supera el stock disponible');
          return item;
        }
        return { ...item, cantidad: nuevaCant, subtotal: nuevaCant * item.precioCalculado };
      }
      return item;
    }).filter(Boolean);

    setCarrito(nuevoCarrito);
  };

  const totalGramos = carrito.reduce((acc, item) => acc + (item.peso * item.cantidad), 0);
  const totalPagar = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const vueltoCalculado = typeof montoPagaCon === 'number' && montoPagaCon >= totalPagar ? montoPagaCon - totalPagar : 0;

  const obtenerSugerenciasEfectivo = (total: number) => {
    if (total <= 0) return [];
    const opcionesSet = new Set<number>();
    opcionesSet.add(total);
    [5, 10, 50, 100, 200].forEach(p => {
      const calc = Math.ceil(total / p) * p;
      if (calc > total) opcionesSet.add(calc);
    });
    return Array.from(opcionesSet).sort((a, b) => a - b).slice(0, 4);
  };

  const disponibleCredito = clienteSeleccionado.tieneCredito 
    ? Math.max(0, clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoDeuda) 
    : 0;

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

    const nuevoInventario = inventario.map((prod: any) => {
      const itemsDelProd = carrito.filter(c => c.productoId === prod.id);
      if (itemsDelProd.length > 0) {
        const variantesActualizadas = prod.variantes.map((v: any) => {
          const itemEnCarrito = itemsDelProd.find(c => c.medida === v.medida);
          if (itemEnCarrito) {
            return { ...v, stock: Math.max(0, v.stock - itemEnCarrito.cantidad) };
          }
          return v;
        });
        return { ...prod, variantes: variantesActualizadas };
      }
      return prod;
    });

    guardarInventarioActualizado(nuevoInventario);

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
      
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #seccion-impresion-ticket, #seccion-impresion-ticket * { visibility: visible; }
          #seccion-impresion-ticket {
            position: absolute; left: 50%; top: 20px; transform: translateX(-50%);
            width: 100%; max-width: 400px; padding: 20px; border: 1px solid #ccc;
            background: white !important; color: black !important;
          }
          .no-imprimir { display: none !important; }
        }
      `}</style>

      {/* ENCABEZADO */}
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
            <p className="text-xs text-slate-400">Inventario y Stock Sincronizados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setInventario(cargarInventarioAdmin()); cargarClientesPOS(); }}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs px-3 py-2 rounded-xl transition font-mono flex items-center gap-1"
          >
            🔄 Sincronizar Todo
          </button>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl transition font-mono"
          >
            ← Panel Admin
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('pos_auth');
              window.location.reload();
            }}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl transition font-mono"
          >
            Cerrar Turno
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden no-imprimir">
        
        {/* COLUMNA IZQUIERDA: ESCÁNER Y CATÁLOGO DE CAJA */}
        <div className="lg:col-span-7 bg-slate-950 p-6 flex flex-col gap-4 border-r border-slate-800 overflow-y-auto">
          
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

          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="🔍 Buscar producto por nombre o categoría..." 
              value={busquedaProd}
              onChange={(e) => setBusquedaProd(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />

            {/* BUSCADOR DESPLEGABLE DE CLIENTES VINCULADOS */}
            <div className="relative flex-1">
              <div 
                onClick={() => setMostrarDropdownCliente(!mostrarDropdownCliente)}
                className="bg-slate-900 border border-amber-500/50 p-2.5 rounded-xl text-xs font-bold text-amber-400 flex justify-between items-center cursor-pointer select-none"
              >
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Cliente Seleccionado ({listaClientes.length} cargados):</span>
                  <span className="text-white font-bold">{clienteSeleccionado.nombre}</span>
                  {clienteSeleccionado.tipo === 'b2b' && (
                    <span className="text-amber-400 font-mono text-[10px] ml-1.5">(Q{clienteSeleccionado.tarifaGramo}/g)</span>
                  )}
                </div>
                <span className="text-slate-400 text-xs ml-2">{mostrarDropdownCliente ? '▲' : '▼'}</span>
              </div>

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
                            if (!c.tieneCredito && metodoPago === 'credito') setMetodoPago('efectivo');
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

          {/* GRID DE PRODUCTOS EN TIEMPO REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventario
              .filter((p: any) => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) || p.categoria.toLowerCase().includes(busquedaProd.toLowerCase()))
              .map((prod: any) => {
                const stockTotal = prod.variantes?.reduce((acc: number, v: any) => acc + Number(v.stock || 0), 0) || 0;
                return (
                  <div key={prod.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex gap-3 items-center">
                      <img src={prod.fotos?.[0]} alt={prod.nombre} className="w-14 h-14 object-cover rounded-xl border border-slate-700 bg-slate-950" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{prod.sku}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${stockTotal > 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            Stock Total: {stockTotal}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-white mt-1 truncate">{prod.nombre}</h3>
                        <p className="text-[10px] text-emerald-400 font-mono font-bold">Público: Q{prod.precioMinorista}</p>
                      </div>
                    </div>

                    {/* SELECCIÓN DE TALLA / VARIANTE */}
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Seleccionar Talla / Medida:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variantes?.map((v: any, idx: number) => (
                          <button
                            key={idx}
                            disabled={v.stock <= 0}
                            onClick={() => agregarAlCarrito(prod, idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                              v.stock > 0 
                                ? 'bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border-slate-700 text-amber-300' 
                                : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {v.medida} ({v.stock}disp)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

        </div>

        {/* COLUMNA DERECHA: CARRITO Y COBRO */}
        <div className="lg:col-span-5 bg-slate-900 p-6 flex flex-col justify-between border-l border-slate-800">
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">🛒 Piezas en Ticket</h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                Items: {carrito.reduce((acc, i) => acc + i.cantidad, 0)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6">
                  <span className="text-3xl mb-2">💎</span>
                  <p className="text-xs">Selecciona la talla de un producto o escanea un código para cobrar</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.itemIdUnico} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Q{item.precioCalculado.toFixed(2)} c/u ({item.peso}g)</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button onClick={() => cambiarCantidad(item.itemIdUnico, -1)} className="w-5 h-5 bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center">-</button>
                      <span className="text-xs font-bold font-mono text-amber-400 px-1">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.itemIdUnico, 1)} className="w-5 h-5 bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center">+</button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <p className="text-xs font-bold text-emerald-400 font-mono">Q{item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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

            <div>
              <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Método de Pago:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button onClick={() => setMetodoPago('efectivo')} className={`p-2 rounded-xl border transition text-center ${metodoPago === 'efectivo' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>💵 Efectivo</button>
                <button onClick={() => setMetodoPago('tarjeta')} className={`p-2 rounded-xl border transition text-center ${metodoPago === 'tarjeta' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>💳 Tarjeta POS</button>
                <button onClick={() => setMetodoPago('transferencia')} className={`p-2 rounded-xl border transition text-center ${metodoPago === 'transferencia' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>🏦 Depósito</button>
                <button onClick={() => { if (!clienteSeleccionado.tieneCredito) return alert('Sin crédito autorizado'); setMetodoPago('credito'); }} className={`p-2 rounded-xl border transition text-center ${metodoPago === 'credito' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>📝 Crédito B2B</button>
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-amber-500/40">
                <div className="space-y-1">
                  <label className="text-xs text-amber-400 font-bold font-mono uppercase">Efectivo Recibido:</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-lg font-black text-amber-500 font-mono">Q</span>
                    <input 
                      type="number" 
                      placeholder={totalPagar.toFixed(2)} 
                      value={montoPagaCon}
                      onChange={(e) => setMontoPagaCon(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-3 pl-8 bg-slate-900 border-2 border-amber-500/60 rounded-xl text-lg font-black font-mono text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {obtenerSugerenciasEfectivo(totalPagar).map((monto, idx) => (
                    <button key={idx} onClick={() => setMontoPagaCon(monto)} className="flex-1 border py-1.5 rounded-lg text-xs font-bold font-mono bg-slate-900 border-slate-800 text-amber-300">
                      Q{monto}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                  <span className="text-slate-400 text-xs font-bold uppercase">Cambio / Vuelto:</span>
                  <span className="text-xl font-black text-amber-400">Q{vueltoCalculado.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              onClick={procesarVenta}
              disabled={carrito.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider font-mono transition shadow-lg"
            >
              ✓ Finalizar Venta y Actualizar Inventario
            </button>
          </div>

        </div>

      </div>

      {/* MODAL TICKET */}
      {ticketEmitido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div id="seccion-impresion-ticket" className="bg-white text-slate-900 max-w-sm w-full p-6 rounded-2xl shadow-2xl font-mono text-xs space-y-4">
            <div className="text-center space-y-1.5 pb-3 border-b border-dashed border-slate-300">
              <img src={logoEmpresaUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-1" />
              <h2 className="text-base font-black font-serif tracking-widest text-slate-900">AG47 JOYERÍA</h2>
              <p className="text-[10px] text-slate-500">Folio: <span className="font-bold">{ticketEmitido.folio}</span></p>
              <p className="text-[10px] text-slate-500">{ticketEmitido.fecha}</p>
            </div>

            <div className="space-y-1.5 py-2 border-y border-dashed border-slate-300">
              {ticketEmitido.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[10px]">
                  <div>
                    <p className="font-bold">{item.nombre}</p>
                    <p className="text-slate-500">{item.cantidad} x Q{item.precioCalculado.toFixed(2)}</p>
                  </div>
                  <span className="font-bold">Q{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL PAGADO:</span>
              <span>Q{ticketEmitido.totalPagar.toFixed(2)}</span>
            </div>

            <div className="pt-3 space-y-2 no-imprimir">
              <button onClick={enviarPorWhatsApp} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs font-mono">
                📲 Enviar Ticket por WhatsApp
              </button>
              <button onClick={() => window.print()} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs font-mono">
                🖨️ Imprimir Comprobante
              </button>
              <button onClick={() => setTicketEmitido(null)} className="w-full bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs font-mono">
                Cerrar y Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
