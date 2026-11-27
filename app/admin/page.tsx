'use client';
import { useState, useEffect, useRef } from 'react';
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

  const [categoriasBase, setCategoriasBase] = useState<string[]>([
    'Pulseras', 'Anillos', 'Cadenas', 'Aretes', 'Gargantillas', 'Dijes'
  ]);

  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [editandoCategoriaIndex, setEditandoCategoriaIndex] = useState<number | null>(null);
  const [nombreCatEditada, setNombreCatEditada] = useState('');

  useEffect(() => {
    const cargarCategoriasSupabase = async () => {
      const { data, error } = await supabase.from('categorias').select('*');
      if (!error && data && data.length > 0) {
        const listaSupabase = data.map((item: any) => item.nombre);
        setCategoriasBase(listaSupabase);
        localStorage.setItem('ag47_categorias_admin', JSON.stringify(listaSupabase));
      } else {
        const guardadas = localStorage.getItem('ag47_categorias_admin');
        if (guardadas) {
          try { setCategoriasBase(JSON.parse(guardadas)); } catch(e) {}
        }
      }
    };
    cargarCategoriasSupabase();
  }, []);

  const agregarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    const catLimpia = nuevaCatInput.trim();
    if (!catLimpia) return;
    if (categoriasBase.includes(catLimpia)) {
      return alert('Esa categoría ya existe.');
    }

    const { error } = await supabase.from('categorias').insert([{ nombre: catLimpia }]);
    if (error) {
      alert('Error al guardar categoría en Supabase: ' + error.message);
      return;
    }

    const actualizadas = [...categoriasBase, catLimpia];
    setCategoriasBase(actualizadas);
    localStorage.setItem('ag47_categorias_admin', JSON.stringify(actualizadas));
    setNuevaCatInput('');
    alert('¡Categoría creada y guardada en Supabase con éxito!');
  };

  const eliminarCategoria = async (catAEliminar: string) => {
    if (categoriasBase.length <= 1) {
      return alert('Debes mantener al menos una categoría.');
    }
    if (confirm(`¿Estás seguro de eliminar la categoría "${catAEliminar}"?`)) {
      const { error } = await supabase.from('categorias').delete().eq('nombre', catAEliminar);
      if (error) {
        alert('Error al eliminar en Supabase: ' + error.message);
        return;
      }

      const actualizadas = categoriasBase.filter((c: string) => c !== catAEliminar);
      setCategoriasBase(actualizadas);
      localStorage.setItem('ag47_categorias_admin', JSON.stringify(actualizadas));
      alert('Categoría eliminada correctamente.');
    }
  };

  const guardarEdicionCategoria = async (indexOriginal: number) => {
    const nombreNuevo = nombreCatEditada.trim();
    if (!nombreNuevo) return;
    const catAntigua = categoriasBase[indexOriginal];

    await supabase.from('categorias').delete().eq('nombre', catAntigua);
    const { error } = await supabase.from('categorias').insert([{ nombre: nombreNuevo }]);

    if (error) {
      alert('Error al actualizar categoría en Supabase: ' + error.message);
      return;
    }

    const actualizadas = [...categoriasBase];
    actualizadas[indexOriginal] = nombreNuevo;
    setCategoriasBase(actualizadas);
    localStorage.setItem('ag47_categorias_admin', JSON.stringify(actualizadas));

    const productosActualizados = productos.map((p: any) => p.categoria === catAntigua ? { ...p, categoria: nombreNuevo } : p);
    setProductos(productosActualizados);
    localStorage.setItem('ag47_inventario_admin', JSON.stringify(productosActualizados));

    for (const p of productosActualizados) {
      if (p.categoria === nombreNuevo) {
        await supabase.from('productos').upsert([{
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          nombre: p.nombre,
          categoria: p.categoria,
          color: p.color || '',
          bano: p.bano || 'Sin baño',
          precio_minorista: p.precioMinorista,
          tipo_precio_mayorista: p.tipoPrecioMayorista,
          precio_pieza_mayorista: p.precioPiezaMayorista,
          fotos: p.fotos,
          variantes: p.variantes
        }]);
      }
    }

    setEditandoCategoriaIndex(null);
    setNombreCatEditada('');
    alert('¡Categoría actualizada correctamente en Supabase!');
  };

  const [clienteDesplegadoId, setClienteDesplegadoId] = useState<number | null>(1);
  const [galeriaDrive, setGaleriaDrive] = useState<any[]>([]);

  useEffect(() => {
    const cargarGaleriaSupabase = async () => {
      try {
        const { data: archivosStorage, error: errorStorage } = await supabase.storage.from('joyas').list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

        if (!errorStorage && archivosStorage && archivosStorage.length > 0) {
          const listaMapeada = archivosStorage
            .filter((archivo: any) => archivo.name && archivo.name !== '.emptyFolderPlaceholder')
            .map((archivo: any) => {
              const { data: urlData } = supabase.storage.from('joyas').getPublicUrl(archivo.name);
              return {
                id: archivo.id || `img_${Math.random()}`,
                url: urlData.publicUrl,
                nombre: archivo.name
              };
            });
          setGaleriaDrive(listaMapeada);
          return;
        }
      } catch (err) {
        console.error('Error al listar Supabase Storage:', err);
      }

      const { data: productosData } = await supabase.from('productos').select('fotos, nombre');
      if (productosData && productosData.length > 0) {
        const fotosExtraidas: any[] = [];
        productosData.forEach((p: any) => {
          if (p.fotos && Array.isArray(p.fotos)) {
            p.fotos.forEach((url: string, idx: number) => {
              if (url && !fotosExtraidas.some(f => f.url === url)) {
                fotosExtraidas.push({
                  id: `prod_img_${p.nombre}_${idx}`,
                  url: url,
                  nombre: `${p.nombre}_${idx + 1}.jpg`
                });
              }
            });
          }
        });
        if (fotosExtraidas.length > 0) {
          setGaleriaDrive(fotosExtraidas);
          return;
        }
      }

      setGaleriaDrive([
        { id: 'img_1', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', nombre: '2.1_T8.jpg' },
        { id: 'img_2', url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800', nombre: '2.7_T8.jpg' }
      ]);
    };

    cargarGaleriaSupabase();
  }, []);

  const [subiendoArchivoSupabase, setSubiendoArchivoSupabase] = useState(false);
  const [modalGaleriaAbierto, setModalGaleriaAbierto] = useState(false);
  const [imagenesSeleccionadasTemp, setImagenesSeleccionadasTemp] = useState<string[]>([]);
  const [filtroGaleriaDrive, setFiltroGaleriaDrive] = useState('');
  const [tipoSeleccionPortada, setTipoSeleccionPortada] = useState<'logo' | 'banner' | null>(null);

  // VENDEDORES SINCRONIZADOS CON SUPABASE
  const [vendedores, setVendedores] = useState<any[]>([
    { id: 1, nombre: 'Marta Gómez', telefono: '4444-0101', usuario: 'marta', password: 'marta2026', ventasRealizadas: 14, totalVendido: 12450, totalGramos: 342.5, totalPiezas: 42, clientesAtendidos: 18, clientesNuevos: 5 },
    { id: 2, nombre: 'Juan Pérez', telefono: '4444-0202', usuario: 'juan', password: 'juan2026', ventasRealizadas: 8, totalVendido: 7800, totalGramos: 210.0, totalPiezas: 24, clientesAtendidos: 11, clientesNuevos: 3 },
  ]);

  useEffect(() => {
    const cargarVendedoresSupabase = async () => {
      const { data, error } = await supabase.from('trabajadores').select('*');
      if (!error && data && data.length > 0) {
        const mapeados = data.map((v: any) => ({
          id: v.id,
          nombre: v.nombre,
          telefono: v.telefono || '',
          usuario: v.usuario,
          password: v.password,
          ventasRealizadas: Number(v.ventas_realizadas || 0),
          totalVendido: Number(v.total_vendido || 0),
          totalGramos: Number(v.total_gramos || 0),
          totalPiezas: Number(v.total_piezas || 0),
          clientesAtendidos: Number(v.clientes_atendidos || 0),
          clientesNuevos: Number(v.clientes_nuevos || 0)
        }));
        setVendedores(mapeados);
        localStorage.setItem('ag47_vendedores_admin', JSON.stringify(mapeados));
      } else {
        const guardados = localStorage.getItem('ag47_vendedores_admin');
        if (guardados) {
          try { setVendedores(JSON.parse(guardados)); } catch(e) {}
        }
      }
    };
    cargarVendedoresSupabase();
  }, []);

  const guardarVendedorEnSupabase = async (vend: any) => {
    const { error } = await supabase.from('trabajadores').upsert([{
      id: vend.id,
      nombre: vend.nombre,
      telefono: vend.telefono,
      usuario: vend.usuario,
      password: vend.password,
      ventas_realizadas: vend.ventasRealizadas,
      total_vendido: vend.totalVendido,
      total_gramos: vend.totalGramos,
      total_piezas: vend.totalPiezas,
      clientes_atendidos: vend.clientesAtendidos,
      clientes_nuevos: vend.clientesNuevos
    }]);

    if (error) {
      console.error('Error al guardar trabajador en Supabase:', error);
    }
  };

  const [nuevoVendedor, setNuevoVendedor] = useState({ 
    nombre: '', 
    telefono: '', 
    usuario: '', 
    password: '',
    ventasRealizadas: 0,
    totalVendido: 0,
    totalGramos: 0,
    totalPiezas: 0,
    clientesAtendidos: 0,
    clientesNuevos: 0
  });

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
          saldoDeuda: Number(item.saldo_deuda || 0),
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
          saldo_deuda: clienteActualizado.saldoDeuda || 0,
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

  const eliminarClienteSupabase = async (id: number, nombreCliente: string) => {
    if (confirm(`¿Estás seguro de eliminar al cliente "${nombreCliente}" de la base de datos y Supabase?`)) {
      const { error } = await supabase.from('mayoristas').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar cliente en Supabase: ' + error.message);
        return;
      }
      setMayoristas(mayoristas.filter(m => m.id !== id));
      alert('Cliente eliminado correctamente de la base de datos.');
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

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [filtroEstadoStock, setFiltroEstadoStock] = useState('Disponibles');
  const [mostrarAgotadosCatalogo, setMostrarAgotadosCatalogo] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);

  const [productos, setProductos] = useState<any[]>([]);

  // ESTADOS PARA VERIFICACIÓN DE INVENTARIO:
  // 1) Escaneado Pendiente de Guardar (persistido en localStorage para no perderlo si recargas tras un error)
  // 2) Escaneado en Esta Sesión (historial de la sesión actual)
  // 3) Piezas Sin Escanear (pendientes con stock que aún no están en pendiente de guardar)
  type RegistroVerificacion = {
    productoId: number;
    varianteIdx: number;
    stockPendiente: number;
    estadoPendiente: 'Disponible' | 'Sin Inventario';
    hora: string;
  };

  const [codigoEscaneo, setCodigoEscaneo] = useState('');
  const [productoEscaneadoId, setProductoEscaneadoId] = useState<number | null>(null);
  const [varianteEscaneadaIdx, setVarianteEscaneadaIdx] = useState<number>(0);
  const [mensajeEscaneo, setMensajeEscaneo] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const [pendienteGuardar, setPendienteGuardar] = useState<RegistroVerificacion[]>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('ag47_verificacion_pendiente_guardar');
      if (guardado) {
        try {
          const parsed = JSON.parse(guardado);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const [escaneadoEstaSesion, setEscaneadoEstaSesion] = useState<RegistroVerificacion[]>([]);
  const [guardandoVerificacion, setGuardandoVerificacion] = useState(false);
  const [filtroSinEscanear, setFiltroSinEscanear] = useState('');
  const [categoriaSinEscanear, setCategoriaSinEscanear] = useState('Todas');
  const inputEscaneoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ag47_verificacion_pendiente_guardar', JSON.stringify(pendienteGuardar));
    }
  }, [pendienteGuardar]);

  useEffect(() => {
    const cargarProductosSupabase = async () => {
      const { data, error } = await supabase.from('productos').select('*');
      if (!error && data && data.length > 0) {
        const mapeados = data.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          nombre: p.nombre,
          categoria: p.categoria,
          color: p.color || '',
          bano: p.bano || 'Sin baño',
          precioMinorista: Number(p.precio_minorista || 0),
          tipoPrecioMayorista: p.tipo_precio_mayorista || 'gramo',
          precioPiezaMayorista: Number(p.precio_pieza_mayorista || 0),
          fotos: p.fotos || [],
          variantes: p.variantes || []
        }));
        setProductos(mapeados);
        localStorage.setItem('ag47_inventario_admin', JSON.stringify(mapeados));
      } else {
        const guardados = localStorage.getItem('ag47_inventario_admin');
        if (guardados) {
          try { setProductos(JSON.parse(guardados)); } catch(e) {}
        }
      }
    };
    cargarProductosSupabase();
  }, []);

  useEffect(() => {
    if (seccion === 'verificacion') {
      setTimeout(() => inputEscaneoRef.current?.focus(), 50);
    }
  }, [seccion]);

  const registrarEnPendienteYSesion = (
    prodId: number,
    varIdx: number,
    stockPendiente: number,
    estadoPendiente: 'Disponible' | 'Sin Inventario'
  ) => {
    const horaStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nuevoRegistro: RegistroVerificacion = {
      productoId: prodId,
      varianteIdx: varIdx,
      stockPendiente,
      estadoPendiente,
      hora: horaStr
    };

    setPendienteGuardar(prev => {
      const sinDuplicado = prev.filter(r => !(r.productoId === prodId && r.varianteIdx === varIdx));
      const actualizado = [nuevoRegistro, ...sinDuplicado];
      localStorage.setItem('ag47_verificacion_pendiente_guardar', JSON.stringify(actualizado));
      return actualizado;
    });

    setEscaneadoEstaSesion(prev => {
      const sinDuplicado = prev.filter(r => !(r.productoId === prodId && r.varianteIdx === varIdx));
      return [nuevoRegistro, ...sinDuplicado];
    });
  };

  const quitarDePendienteGuardar = (prodId: number, varIdx: number) => {
    setPendienteGuardar(prev => {
      const actualizado = prev.filter(r => !(r.productoId === prodId && r.varianteIdx === varIdx));
      localStorage.setItem('ag47_verificacion_pendiente_guardar', JSON.stringify(actualizado));
      return actualizado;
    });
  };

  const guardarPendientesEnSupabase = async () => {
    if (pendienteGuardar.length === 0) return;
    setGuardandoVerificacion(true);

    try {
      const mapaCambios = new Map<number, Map<number, number>>();
      pendienteGuardar.forEach((reg) => {
        if (!mapaCambios.has(reg.productoId)) {
          mapaCambios.set(reg.productoId, new Map());
        }
        mapaCambios.get(reg.productoId)!.set(reg.varianteIdx, Number(reg.stockPendiente || 0));
      });

      const productosAfectados: any[] = [];
      const listaActualizada = productos.map((p: any) => {
        const cambiosVar = mapaCambios.get(p.id);
        if (!cambiosVar) return p;
        const vars = Array.isArray(p.variantes) && p.variantes.length > 0
          ? [...p.variantes]
          : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];

        cambiosVar.forEach((nuevoStock, vIdx) => {
          if (vars[vIdx]) {
            vars[vIdx] = { ...vars[vIdx], stock: nuevoStock };
          }
        });

        const prodActualizado = { ...p, variantes: vars };
        productosAfectados.push(prodActualizado);
        return prodActualizado;
      });

      setProductos(listaActualizada);
      localStorage.setItem('ag47_inventario_admin', JSON.stringify(listaActualizada));

      const payloads = productosAfectados.map((prodActualizado: any) => ({
        id: prodActualizado.id,
        sku: prodActualizado.sku,
        barcode: prodActualizado.barcode || '',
        nombre: prodActualizado.nombre,
        categoria: prodActualizado.categoria,
        color: prodActualizado.color || '',
        bano: prodActualizado.bano || 'Sin baño',
        precio_minorista: Number(prodActualizado.precioMinorista || 0),
        tipo_precio_mayorista: prodActualizado.tipoPrecioMayorista || 'gramo',
        precio_pieza_mayorista: Number(prodActualizado.precioPiezaMayorista || 0),
        fotos: prodActualizado.fotos || [],
        variantes: prodActualizado.variantes || []
      }));

      const { error } = await supabase.from('productos').upsert(payloads);
      setGuardandoVerificacion(false);

      if (error) {
        setMensajeEscaneo({
          tipo: 'err',
          texto: 'Error al guardar en Supabase (tu lote sigue guardado localmente): ' + error.message
        });
        return;
      }

      const totalGuardadas = pendienteGuardar.length;
      setPendienteGuardar([]);
      localStorage.removeItem('ag47_verificacion_pendiente_guardar');
      setMensajeEscaneo({
        tipo: 'ok',
        texto: `¡Guardadas ${totalGuardadas} pieza(s) pendientes en Supabase y catálogo!`
      });
      inputEscaneoRef.current?.focus();
    } catch (err: any) {
      setGuardandoVerificacion(false);
      setMensajeEscaneo({
        tipo: 'err',
        texto: 'Ocurrió un error al guardar (tu lote sigue protegido en memoria local): ' + (err?.message || 'Error desconocido')
      });
    }
  };

  const obtenerStockTotalProducto = (p: any) => {
    if (!Array.isArray(p.variantes) || p.variantes.length === 0) return 0;
    return p.variantes.reduce((acc: number, v: any) => acc + Number(v.stock || 0), 0);
  };

  const elegirVarianteConPrioridad = (variantes: any[], idxCoincidente = 0) => {
    const lista = Array.isArray(variantes) && variantes.length > 0
      ? variantes
      : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];
    if (Number(lista[idxCoincidente]?.stock || 0) > 0) {
      return { variantes: lista, idx: idxCoincidente };
    }
    const idxDisponible = lista.findIndex((v: any) => Number(v.stock || 0) > 0);
    return { variantes: lista, idx: idxDisponible !== -1 ? idxDisponible : idxCoincidente };
  };

  const procesarEscaneoCodigo = (codigoRaw?: string) => {
    try {
      const q = (codigoRaw !== undefined ? codigoRaw : codigoEscaneo).trim().toLowerCase();
      if (!q) return;

      let coincidenciaDisponible: { prod: any; varIdx: number } | null = null;
      let coincidenciaCualquiera: { prod: any; varIdx: number } | null = null;

      for (let i = 0; i < productos.length; i++) {
        const p = productos[i];
        if (!p) continue;
        if (Array.isArray(p.variantes)) {
          for (let vIdx = 0; vIdx < p.variantes.length; vIdx++) {
            const v = p.variantes[vIdx];
            if (!v) continue;
            const matchVar =
              (v.barcode && String(v.barcode).trim().toLowerCase() === q) ||
              (v.sku && String(v.sku).trim().toLowerCase() === q);
            if (matchVar) {
              if (!coincidenciaCualquiera) coincidenciaCualquiera = { prod: p, varIdx: vIdx };
              if (!coincidenciaDisponible && Number(v.stock || 0) > 0) {
                coincidenciaDisponible = { prod: p, varIdx: vIdx };
              }
            }
          }
        }

        const matchProd =
          (p.barcode && String(p.barcode).trim().toLowerCase() === q) ||
          (p.sku && String(p.sku).trim().toLowerCase() === q) ||
          (p.nombre && String(p.nombre).trim().toLowerCase() === q);

        if (matchProd) {
          const elegida = elegirVarianteConPrioridad(p.variantes, 0);
          if (!coincidenciaCualquiera) coincidenciaCualquiera = { prod: p, varIdx: elegida.idx };
          if (!coincidenciaDisponible && obtenerStockTotalProducto(p) > 0) {
            coincidenciaDisponible = { prod: p, varIdx: elegida.idx };
          }
        }
      }

      const elegidaFinal = coincidenciaDisponible || coincidenciaCualquiera;

      if (!elegidaFinal) {
        setMensajeEscaneo({ tipo: 'err', texto: `No se encontró ninguna joya con el código "${codigoRaw ?? codigoEscaneo}".` });
        setCodigoEscaneo('');
        inputEscaneoRef.current?.focus();
        return;
      }

      const { variantes: vars, idx: varIdxFinal } = elegirVarianteConPrioridad(elegidaFinal.prod.variantes, elegidaFinal.varIdx);
      setProductoEscaneadoId(elegidaFinal.prod.id);
      setVarianteEscaneadaIdx(varIdxFinal);

      const pendienteExistente = pendienteGuardar.find(
        (r) => r.productoId === elegidaFinal.prod.id && r.varianteIdx === varIdxFinal
      );
      const stockRef = pendienteExistente
        ? Number(pendienteExistente.stockPendiente || 0)
        : Number(vars[varIdxFinal]?.stock || 0);
      const estadoRef: 'Disponible' | 'Sin Inventario' = stockRef > 0 ? 'Disponible' : 'Sin Inventario';

      registrarEnPendienteYSesion(elegidaFinal.prod.id, varIdxFinal, stockRef, estadoRef);
      setMensajeEscaneo({
        tipo: 'ok',
        texto: `Añadida a Escaneado Pendiente de Guardar y Sesión: ${elegidaFinal.prod.nombre || 'Sin nombre'} (${vars[varIdxFinal]?.medida || 'Estándar'}) — Stock: ${stockRef}`
      });
      setCodigoEscaneo('');
      inputEscaneoRef.current?.focus();
    } catch (err: any) {
      setMensajeEscaneo({
        tipo: 'err',
        texto: `Error al procesar la pieza "${codigoRaw ?? codigoEscaneo}" (${err?.message || 'revisa sus datos'}). Tu lote pendiente está intacto.`
      });
      setCodigoEscaneo('');
      inputEscaneoRef.current?.focus();
    }
  };

  const obtenerStockPendienteActual = (prodId: number, varIdx: number, prod: any) => {
    const pendiente = pendienteGuardar.find(
      (r) => r.productoId === prodId && r.varianteIdx === varIdx
    );
    if (pendiente) return Number(pendiente.stockPendiente || 0);
    const vars = Array.isArray(prod?.variantes) && prod.variantes.length > 0
      ? prod.variantes
      : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];
    return Number(vars[varIdx]?.stock || 0);
  };

  const cambiarCantidadVerificacion = (delta: number, valorDirecto?: number) => {
    const prod = productos.find((p: any) => p.id === productoEscaneadoId);
    if (!prod) return;
    const vars = Array.isArray(prod.variantes) && prod.variantes.length > 0
      ? prod.variantes
      : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];
    const actual = obtenerStockPendienteActual(prod.id, varianteEscaneadaIdx, prod);
    const nuevaCant = valorDirecto !== undefined ? Math.max(0, Math.floor(valorDirecto)) : Math.max(0, actual + delta);
    const estadoMarca: 'Disponible' | 'Sin Inventario' = nuevaCant > 0 ? 'Disponible' : 'Sin Inventario';

    registrarEnPendienteYSesion(prod.id, varianteEscaneadaIdx, nuevaCant, estadoMarca);
    setMensajeEscaneo({
      tipo: 'ok',
      texto: `Pendiente de guardar actualizado: ${prod.nombre} (${vars[varianteEscaneadaIdx]?.medida || 'Estándar'}) → ${nuevaCant} pzas.`
    });
    inputEscaneoRef.current?.focus();
  };

  const marcarEstadoVerificacion = (nuevoEstado: 'Disponible' | 'Sin Inventario') => {
    const prod = productos.find((p: any) => p.id === productoEscaneadoId);
    if (!prod) return;
    const stockActual = obtenerStockPendienteActual(prod.id, varianteEscaneadaIdx, prod);
    const nuevaCant = nuevoEstado === 'Sin Inventario' ? 0 : (stockActual > 0 ? stockActual : 1);

    registrarEnPendienteYSesion(prod.id, varianteEscaneadaIdx, nuevaCant, nuevoEstado);
    setMensajeEscaneo({
      tipo: 'ok',
      texto: `Marcado como ${nuevoEstado} (${nuevaCant} pzas) en Pendiente de Guardar — ${prod.nombre}.`
    });
    inputEscaneoRef.current?.focus();
  };

  const marcarVarianteSinEscanearSinInventario = (prodId: number, varIdx: number) => {
    const prod = productos.find((p: any) => p.id === prodId);
    if (!prod) return;
    const vars = Array.isArray(prod.variantes) && prod.variantes.length > 0
      ? prod.variantes
      : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];
    registrarEnPendienteYSesion(prodId, varIdx, 0, 'Sin Inventario');
    setMensajeEscaneo({
      tipo: 'ok',
      texto: `Marcada Sin Inventario en Pendiente de Guardar: ${prod.nombre} (${vars[varIdx]?.medida || 'Estándar'}).`
    });
  };

  const piezasSinEscanear = (() => {
    const texto = filtroSinEscanear.toLowerCase().trim();
    const filas: { prod: any; varIdx: number; variante: any }[] = [];

    productos.forEach((p: any) => {
      if (!p) return;
      if (categoriaSinEscanear !== 'Todas' && p.categoria !== categoriaSinEscanear) return;
      const vars = Array.isArray(p.variantes) && p.variantes.length > 0
        ? p.variantes
        : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }];

      vars.forEach((v: any, vIdx: number) => {
        if (!v || Number(v.stock || 0) <= 0) return;
        const yaEnPendiente = pendienteGuardar.some(
          (reg) => reg.productoId === p.id && reg.varianteIdx === vIdx
        );
        if (yaEnPendiente) return;

        const coincideTexto = !texto ||
          (p.nombre && String(p.nombre).toLowerCase().includes(texto)) ||
          (p.sku && String(p.sku).toLowerCase().includes(texto)) ||
          (p.barcode && String(p.barcode).toLowerCase().includes(texto)) ||
          (v.sku && String(v.sku).toLowerCase().includes(texto)) ||
          (v.barcode && String(v.barcode).toLowerCase().includes(texto)) ||
          (v.medida && String(v.medida).toLowerCase().includes(texto));

        if (coincideTexto) {
          filas.push({ prod: p, varIdx: vIdx, variante: v });
        }
      });
    });

    return filas;
  })();

  const marcarTodasSinEscanearSinInventario = () => {
    if (piezasSinEscanear.length === 0) return;
    if (!confirm(`¿Marcar ${piezasSinEscanear.length} pieza(s)/variante(s) sin escanear como Sin Inventario (stock 0) en Pendiente de Guardar?`)) return;

    piezasSinEscanear.forEach(({ prod, varIdx }) => {
      registrarEnPendienteYSesion(prod.id, varIdx, 0, 'Sin Inventario');
    });

    setMensajeEscaneo({
      tipo: 'ok',
      texto: `Se pasaron ${piezasSinEscanear.length} pieza(s) a Sin Inventario en Pendiente de Guardar.`
    });
  };

  const [nuevoProd, setNuevoProd] = useState({
    sku: '', 
    barcode: '',
    nombre: '', 
    categoria: categoriasBase[0] || 'Anillos',
    color: '',
    bano: 'Sin baño',
    precioMinorista: 0, 
    tipoPrecioMayorista: 'gramo' as 'gramo' | 'pieza',
    precioPiezaMayorista: 0,
    fotos: [] as string[],
    variantes: [{ medida: 'Talla 6', peso: 0, stock: 0, sku: '', barcode: '' }]
  });

  const manejarSubidaArchivoSupabaseStorage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoArchivoSupabase(true);
    try {
      const nombreArchivo = `${Date.now()}-${archivo.name.replace(/\s+/g, '_')}`;
      
      const { error } = await supabase.storage
        .from('joyas')
        .upload(nombreArchivo, archivo);

      if (error) {
        alert('Error al subir a Supabase Storage: ' + error.message + '\n(Asegúrate de crear un bucket público llamado "joyas").');
        setSubiendoArchivoSupabase(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('joyas')
        .getPublicUrl(nombreArchivo);

      if (urlData?.publicUrl) {
        const nuevaImg = {
          id: `img_${Date.now()}`,
          url: urlData.publicUrl,
          nombre: archivo.name
        };

        const galeriaActualizada = [nuevaImg, ...galeriaDrive];
        setGaleriaDrive(galeriaActualizada);

        if (tipoSeleccionPortada === null) {
          setNuevoProd({
            ...nuevoProd,
            fotos: [...nuevoProd.fotos, urlData.publicUrl]
          });
        }

        alert('¡Imagen subida a Supabase y añadida a tu galería!');
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setSubiendoArchivoSupabase(false);
    }
  };

  const [portada, setPortada] = useState({
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
  });

  useEffect(() => {
    const cargarConfigSupabase = async () => {
      const { data, error } = await supabase.from('config_tienda').select('*').eq('id', 1).single();
      if (!error && data && data.datos) {
        setPortada(data.datos);
        localStorage.setItem('config_portada_ag47', JSON.stringify(data.datos));
      } else {
        const guardado = localStorage.getItem('config_portada_ag47');
        if (guardado) {
          try { setPortada(JSON.parse(guardado)); } catch(e) {}
        }
      }
    };
    cargarConfigSupabase();
  }, []);

  const guardarConfiguracionPortada = async () => {
    const { error } = await supabase.from('config_tienda').upsert([
      { id: 1, datos: portada }
    ]);

    if (error) {
      alert('Error al guardar configuración en Supabase: ' + error.message);
      return;
    }

    localStorage.setItem('config_portada_ag47', JSON.stringify(portada));
    alert('¡Configuración de marca, textos y estilos guardada en Supabase con éxito!');
  };

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

  const exportarCatalogoCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,SKU,Barcode,Nombre,Categoria,Color,Bano,PrecioMinorista,TipoMayorista,PrecioPiezaMayorista,ImagenURL_1,ImagenURL_2\n";
    
    productos.forEach(p => {
      const img1 = p.fotos[0] || '';
      const img2 = p.fotos[1] || '';
      const row = `"${p.sku}","${p.barcode || ''}","${p.nombre}","${p.categoria}","${p.color || ''}","${p.bano || 'Sin baño'}",${p.precioMinorista},"${p.tipoPrecioMayorista}",${p.precioPiezaMayorista || 0},"${img1}","${img2}"`;
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

  const agregarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoVendedor.nombre || !nuevoVendedor.usuario || !nuevoVendedor.password) {
      return alert('Completa el nombre, usuario y contraseña del trabajador.');
    }
    const vendCreado = { 
      ...nuevoVendedor, 
      id: Date.now(), 
      ventasRealizadas: Number(nuevoVendedor.ventasRealizadas || 0), 
      totalVendido: Number(nuevoVendedor.totalVendido || 0),
      totalGramos: Number(nuevoVendedor.totalGramos || 0),
      totalPiezas: Number(nuevoVendedor.totalPiezas || 0),
      clientesAtendidos: Number(nuevoVendedor.clientesAtendidos || 0),
      clientesNuevos: Number(nuevoVendedor.clientesNuevos || 0)
    };

    const actualizados = [...vendedores, vendCreado];
    setVendedores(actualizados);
    localStorage.setItem('ag47_vendedores_admin', JSON.stringify(actualizados));
    await guardarVendedorEnSupabase(vendCreado);

    setNuevoVendedor({ nombre: '', telefono: '', usuario: '', password: '', ventasRealizadas: 0, totalVendido: 0, totalGramos: 0, totalPiezas: 0, clientesAtendidos: 0, clientesNuevos: 0 });
    alert('Trabajador registrado con éxito y guardado en Supabase.');
  };

  const eliminarVendedor = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este perfil de trabajador?')) {
      const { error } = await supabase.from('trabajadores').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar en Supabase:', error);
      }
      const actualizados = vendedores.filter(v => v.id !== id);
      setVendedores(actualizados);
      localStorage.setItem('ag47_vendedores_admin', JSON.stringify(actualizados));
    }
  };

  const actualizarMetricaVendedor = async (id: number, campo: string, valor: number) => {
    const actualizados = vendedores.map(v => v.id === id ? { ...v, [campo]: Math.max(0, valor) } : v);
    setVendedores(actualizados);
    localStorage.setItem('ag47_vendedores_admin', JSON.stringify(actualizados));
    const vendModificado = actualizados.find(v => v.id === id);
    if (vendModificado) {
      await guardarVendedorEnSupabase(vendModificado);
    }
  };

  const crearCupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCupon.codigo) return;
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
    alert('Código de descuento activado correctamente.');
  };

  const cambiarEstadoCupon = (id: number) => {
    setCupones(cupones.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const agregarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCliente.nombre) return;
    const base = Number(nuevoCliente.tarifaG);
    const preciosBase: Record<string, number> = {};
    categoriasBase.forEach((c: string) => preciosBase[c] = base);

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
        saldo_deuda: 0,
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

  const enviarAccesosWhatsapp = (cliente: any) => {
    let mensaje = `¡Hola *${cliente.nombre}*! Tu cuenta mayorista en *AG47* ha sido habilitada.\n\n`;
    mensaje += `Tus datos de acceso al Portal B2B son:\n`;
    mensaje += `• Usuario: *${cliente.usuario}*\n`;
    mensaje += `• Contraseña: *${cliente.password}*\n\n`;
    mensaje += `Ya puedes ingresar y cotizar con tus tarifas preferenciales. ¡Bienvenido/a!`;

    const url = `https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const agregarCampoVariante = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setNuevoProd({
      ...nuevoProd,
      variantes: [...nuevoProd.variantes, { medida: '', peso: 0, stock: 0, sku: '', barcode: '' }]
    });
  };

  const actualizarVarianteForm = (index: number, campo: string, valor: any) => {
    const nuevasVar = [...nuevoProd.variantes];
    nuevasVar[index] = { ...nuevasVar[index], [campo]: valor };
    setNuevoProd({ ...nuevoProd, variantes: nuevasVar });
  };

  const guardarOActualizarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoProd.fotos.length === 0) {
      return alert('Por favor selecciona o sube al menos una imagen.');
    }

    if (nuevoProd.tipoPrecioMayorista === 'pieza' && (!nuevoProd.precioPiezaMayorista || nuevoProd.precioPiezaMayorista <= 0)) {
      return alert('Por favor ingresa un precio de pieza mayorista válido.');
    }

    const productoIdFinal = editandoProductoId !== null ? editandoProductoId : Date.now();
    const productoObj = { 
      id: productoIdFinal,
      sku: nuevoProd.sku,
      barcode: nuevoProd.barcode || '',
      nombre: nuevoProd.nombre,
      categoria: nuevoProd.categoria,
      color: nuevoProd.color || '',
      bano: nuevoProd.bano || 'Sin baño',
      precio_minorista: Number(nuevoProd.precioMinorista),
      tipo_precio_mayorista: nuevoProd.tipoPrecioMayorista,
      precio_pieza_mayorista: nuevoProd.tipoPrecioMayorista === 'pieza' ? Number(nuevoProd.precioPiezaMayorista) : 0,
      fotos: nuevoProd.fotos,
      variantes: nuevoProd.variantes
    };

    const { error } = await supabase.from('productos').upsert([productoObj]);

    if (error) {
      alert('Error al guardar en Supabase: ' + error.message);
      return;
    }

    const productoLocalMapeado = {
      id: productoObj.id,
      sku: productoObj.sku,
      barcode: productoObj.barcode,
      nombre: productoObj.nombre,
      categoria: productoObj.categoria,
      color: productoObj.color,
      bano: productoObj.bano,
      precioMinorista: productoObj.precio_minorista,
      tipoPrecioMayorista: productoObj.tipo_precio_mayorista,
      precioPiezaMayorista: productoObj.precio_pieza_mayorista,
      fotos: productoObj.fotos,
      variantes: productoObj.variantes
    };

    if (editandoProductoId !== null) {
      const actualizados = productos.map((p: any) => p.id === editandoProductoId ? productoLocalMapeado : p);
      setProductos(actualizados);
      localStorage.setItem('ag47_inventario_admin', JSON.stringify(actualizados));
      setEditandoProductoId(null);
      alert('¡Joya actualizada y sincronizada en Supabase!');
    } else {
      const nuevosProductos = [productoLocalMapeado, ...productos];
      setProductos(nuevosProductos);
      localStorage.setItem('ag47_inventario_admin', JSON.stringify(nuevosProductos));
      alert('¡Joya guardada y sincronizada exitosamente en Supabase!');
    }
    
    setNuevoProd({ 
      sku: '', 
      barcode: '', 
      nombre: '', 
      categoria: categoriasBase[0] || 'Anillos',
      color: '',
      bano: 'Sin baño',
      precioMinorista: 0, 
      tipoPrecioMayorista: 'gramo',
      precioPiezaMayorista: 0,
      fotos: [], 
      variantes: [{ medida: 'Talla 6', peso: 0, stock: 0, sku: '', barcode: '' }] 
    });
  };

  const eliminarProducto = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar en Supabase: ' + error.message);
        return;
      }

      const filtrados = productos.filter((p: any) => p.id !== id);
      setProductos(filtrados);
      localStorage.setItem('ag47_inventario_admin', JSON.stringify(filtrados));
      alert('Producto eliminado correctamente.');
    }
  };

  const cargarProductoParaEditar = (p: any) => {
    setEditandoProductoId(p.id);
    setNuevoProd({
      sku: p.sku,
      barcode: p.barcode || '',
      nombre: p.nombre,
      categoria: p.categoria,
      color: p.color || '',
      bano: p.bano || 'Sin baño',
      precioMinorista: p.precioMinorista,
      tipoPrecioMayorista: p.tipoPrecioMayorista || 'gramo',
      precioPiezaMayorista: p.precioPiezaMayorista || 0,
      fotos: p.fotos,
      variantes: p.variantes
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const obtenerEstadoStockProducto = (p: any) => {
    const totalStock = obtenerStockTotalProducto(p);
    if (totalStock === 0) return { texto: 'Agotado', clase: 'bg-rose-600/20 text-rose-400 border-rose-600/40' };
    if (totalStock <= 3) return { texto: 'Baja cantidad', clase: 'bg-amber-600/20 text-amber-400 border-amber-600/40' };
    return { texto: 'Disponible', clase: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40' };
  };

  const productosFiltrados = productos.filter((p: any) => {
    const cumpleCat = categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada;
    const estadoObj = obtenerEstadoStockProducto(p);
    const totalStock = obtenerStockTotalProducto(p);

    if (!mostrarAgotadosCatalogo && totalStock === 0) {
      return false;
    }

    const cumpleStock = filtroEstadoStock === 'Disponibles'
      ? totalStock > 0
      : (filtroEstadoStock === 'Todos' || estadoObj.texto === filtroEstadoStock);
    
    const textoBusqueda = busquedaProducto.toLowerCase().trim();
    const cumpleBusqueda = !textoBusqueda || 
      p.nombre.toLowerCase().includes(textoBusqueda) || 
      p.sku.toLowerCase().includes(textoBusqueda) || 
      (p.barcode && p.barcode.toLowerCase().includes(textoBusqueda)) ||
      (p.color && p.color.toLowerCase().includes(textoBusqueda)) ||
      (p.bano && p.bano.toLowerCase().includes(textoBusqueda)) ||
      (p.variantes && p.variantes.some((v: any) => (v.sku && v.sku.toLowerCase().includes(textoBusqueda)) || (v.barcode && v.barcode.toLowerCase().includes(textoBusqueda))));

    return cumpleCat && cumpleStock && cumpleBusqueda;
  });

  const cambiarEstadoPedidoDirecto = (pedidoId: number, nuevoEstado: string) => {
    setPedidos(pedidos.map((p: any) => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
  };

  const guardarRevisionPedido = () => {
    setPedidos(pedidos.map((p: any) => p.id === pedidoDetalleModal.id ? pedidoDetalleModal : p));
    setPedidoDetalleModal(null);
    alert('Pedido guardado con su nuevo estado.');
  };

  const pedidosFiltrados = filtroEstadoPedido === 'Todos'
    ? pedidos
    : pedidos.filter((p: any) => p.estado === filtroEstadoPedido);

  const productoVerificadoActual = productos.find((p: any) => p.id === productoEscaneadoId) || null;
  const variantesVerificacionActual = productoVerificadoActual
    ? (Array.isArray(productoVerificadoActual.variantes) && productoVerificadoActual.variantes.length > 0
      ? productoVerificadoActual.variantes
      : [{ medida: 'Estándar', peso: 0, stock: 0, sku: '', barcode: '' }])
    : [];
  const varianteVerificacionActual = variantesVerificacionActual[varianteEscaneadaIdx] || variantesVerificacionActual[0] || null;
  const stockVerificacionActual = productoVerificadoActual
    ? obtenerStockPendienteActual(productoVerificadoActual.id, varianteEscaneadaIdx, productoVerificadoActual)
    : 0;

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

            <button onClick={() => setSeccion('verificacion')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition ${seccion === 'verificacion' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <span>📷</span>
              <span>Verificación Inventario</span>
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
            📥 Exportar CSV con links Supabase
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
              {pedidosFiltrados.map((ped: any) => (
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
                  {cupones.map((c: any) => (
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
              <p className="text-xs text-slate-400">Edita tarifas, créditos, credenciales, elimina clientes de la BD y controla el crédito en uso.</p>
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

            <div className="space-y-4">
              {mayoristas.map((m: any) => {
                const estaDesplegado = clienteDesplegadoId === m.id;
                return (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">{m.nombre}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.estado === 'Autorizada' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40' : 'bg-rose-600/20 text-rose-400 border border-rose-600/40'}`}>
                            {m.estado}
                          </span>
                          {m.tieneCredito && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-mono">
                              Crédito en uso: Q{Number(m.saldoDeuda || 0).toFixed(2)} / Q{Number(m.limiteCredito || 0).toFixed(2)}
                            </span>
                          )}
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
                          onClick={() => eliminarClienteSupabase(m.id, m.nombre)}
                          className="bg-rose-800 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded text-[10px] transition"
                        >
                          🗑️ Eliminar Cliente
                        </button>
                        <button 
                          onClick={() => setClienteDesplegadoId(estaDesplegado ? null : m.id)} 
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition"
                        >
                          {estaDesplegado ? '▲ Ocultar Ajustes' : '▼ Editar Tarifas y Crédito'}
                        </button>
                      </div>
                    </div>

                    {estaDesplegado && (
                      <div className="bg-slate-950 p-5 border-t border-slate-800 space-y-6">
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
                                  setMayoristas(mayoristas.map((item: any) => item.id === m.id ? { ...item, usuario: val } : item));
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
                                  setMayoristas(mayoristas.map((item: any) => item.id === m.id ? { ...item, password: val } : item));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-bold text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">⚖️ Tarifario por Gramo por Categoría (Q)</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {categoriasBase.map((cat: string) => {
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

                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">💳 Configuración de Crédito & Saldo en Uso</h4>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              <div>
                                <label className="block text-slate-400 mb-1">Límite Autorizado (Q):</label>
                                <input 
                                  type="number" 
                                  value={m.limiteCredito} 
                                  onChange={(e) => actualizarCreditoCliente(m.id, 'limiteCredito', Number(e.target.value))}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Saldo en Deuda / En Uso (Q):</label>
                                <input 
                                  type="number" 
                                  value={m.saldoDeuda || 0} 
                                  onChange={(e) => actualizarCreditoCliente(m.id, 'saldoDeuda', Number(e.target.value))}
                                  className="w-full p-2 bg-slate-900 border border-amber-500/60 rounded text-amber-400 font-bold font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Plazo de Días:</label>
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-400">Control de Trabajadores & Métricas en Supabase</h2>
                <p className="text-xs text-slate-400">Registra y guarda trabajadores en Supabase para supervisar las ventas cerradas y métricas del mes.</p>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold text-xs">
                📅 Periodo: Octubre 2026
              </span>
            </div>

            <form onSubmit={agregarVendedor} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">＋ Registrar Nuevo Trabajador / Vendedor en Supabase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <input type="text" placeholder="Nombre completo" value={nuevoVendedor.nombre} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, nombre: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Teléfono" value={nuevoVendedor.telefono} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, telefono: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Usuario" value={nuevoVendedor.usuario} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, usuario: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Contraseña" value={nuevoVendedor.password} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, password: e.target.value })} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" required />
              </div>
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded text-xs uppercase shadow transition">Registrar Vendedor</button>
            </form>

            <div className="space-y-4">
              <h3 className="font-bold uppercase text-amber-400 text-xs">📊 Desempeño y Cierres del Mes por Vendedor</h3>
              
              {vendedores.map((vend: any) => (
                <div key={vend.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">👔 {vend.nombre}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400 font-mono text-[11px]">Usuario: {vend.usuario}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Teléfono: {vend.telefono}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => eliminarVendedor(vend.id)}
                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold px-3 py-1.5 rounded transition"
                      >
                        🗑️ Eliminar Vendedor
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Ventas Cerradas</span>
                      <input 
                        type="number" 
                        value={vend.ventasRealizadas} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'ventasRealizadas', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-bold text-sm"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Piezas Totales</span>
                      <input 
                        type="number" 
                        value={vend.totalPiezas || (vend.ventasRealizadas * 3)} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'totalPiezas', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-amber-400 font-bold text-sm"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Gramos Totales</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={vend.totalGramos || (vend.ventasRealizadas * 24.5)} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'totalGramos', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-amber-400 font-bold text-sm"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Dinero (Q)</span>
                      <input 
                        type="number" 
                        value={vend.totalVendido} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'totalVendido', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-emerald-400 font-bold text-sm"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Clientes Atendidos</span>
                      <input 
                        type="number" 
                        value={vend.clientesAtendidos || (vend.ventasRealizadas + 2)} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'clientesAtendidos', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-bold text-sm"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Clientes Nuevos</span>
                      <input 
                        type="number" 
                        value={vend.clientesNuevos || Math.max(1, Math.floor(vend.ventasRealizadas / 3))} 
                        onChange={(e) => actualizarMetricaVendedor(vend.id, 'clientesNuevos', Number(e.target.value))}
                        className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-center text-blue-400 font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTOS & SUPABASE */}
        {seccion === 'productos' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-400">Inventario Sincronizado en Supabase</h2>
                <p className="text-xs text-slate-400">Las piezas creadas aquí se guardan de forma permanente en la nube para el Admin y el POS.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAgotadosCatalogo(!mostrarAgotadosCatalogo)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                    mostrarAgotadosCatalogo
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mostrarAgotadosCatalogo ? '👁️ Ocultando Agotados (Ver solo activos)' : '🙈 Agotados Ocultos (Ver agotados)'}
                </button>

                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                  {['Disponibles', 'Baja cantidad', 'Agotado', 'Todos'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setFiltroEstadoStock(st);
                        if (st === 'Agotado' || st === 'Todos') setMostrarAgotadosCatalogo(true);
                      }}
                      className={`px-3 py-1.5 rounded transition ${
                        filtroEstadoStock === st ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BARRA DE BÚSQUEDA DE PRODUCTOS */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <span className="text-amber-400 text-sm font-bold">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar producto por nombre, SKU o código de barras..." 
                value={busquedaProducto} 
                onChange={(e) => setBusquedaProducto(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              {busquedaProducto && (
                <button 
                  onClick={() => setBusquedaProducto('')} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* GESTIÓN DE CATEGORÍAS */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">📂 Administración de Categorías del Catálogo (Sincronizado Supabase)</h3>
              
              <form onSubmit={agregarCategoria} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nueva categoría (ej. Relojes)" 
                  value={nuevaCatInput} 
                  onChange={(e) => setNuevaCatInput(e.target.value)} 
                  className="p-2 bg-slate-950 border border-slate-800 rounded text-white flex-1" 
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded uppercase">
                  ＋ Crear Categoría
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {categoriasBase.map((cat: string, index: number) => (
                  <div key={cat} className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex items-center space-x-2">
                    {editandoCategoriaIndex === index ? (
                      <div className="flex items-center space-x-1">
                        <input 
                          type="text" 
                          value={nombreCatEditada} 
                          onChange={(e) => setNombreCatEditada(e.target.value)} 
                          className="p-1 bg-slate-900 border border-amber-500 rounded text-amber-400 w-28"
                          autoFocus
                        />
                        <button type="button" onClick={() => guardarEdicionCategoria(index)} className="bg-emerald-600 text-white px-2 py-1 rounded font-bold">✓</button>
                        <button type="button" onClick={() => setEditandoCategoriaIndex(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-amber-400">{cat}</span>
                        <button type="button" onClick={() => { setEditandoCategoriaIndex(index); setNombreCatEditada(cat); }} className="text-slate-400 hover:text-white px-1">✏️</button>
                        <button type="button" onClick={() => eliminarCategoria(cat)} className="text-rose-400 hover:text-rose-300 px-1 font-bold">✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={guardarOActualizarProducto} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold uppercase text-amber-400">
                  {editandoProductoId !== null ? '✏️ Editando Joya ID: ' + editandoProductoId : '＋ Registrar Joya en Supabase'}
                </h3>
                {editandoProductoId !== null && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditandoProductoId(null);
                      setNuevoProd({ sku: '', barcode: '', nombre: '', categoria: categoriasBase[0], color: '', bano: 'Sin baño', precioMinorista: 0, tipoPrecioMayorista: 'gramo', precioPiezaMayorista: 0, fotos: [], variantes: [{ medida: 'Talla 6', peso: 0, stock: 0, sku: '', barcode: '' }] });
                    }} 
                    className="text-rose-400 font-bold hover:underline"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" placeholder="SKU General" value={nuevoProd.sku} onChange={(e) => setNuevoProd({ ...nuevoProd, sku: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <input type="text" placeholder="Código de Barras General" value={nuevoProd.barcode} onChange={(e) => setNuevoProd({ ...nuevoProd, barcode: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono" />
                <input type="text" placeholder="Nombre" value={nuevoProd.nombre} onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
                <select value={nuevoProd.categoria} onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white">
                  {categoriasBase.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Color" value={nuevoProd.color} onChange={(e) => setNuevoProd({ ...nuevoProd, color: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" />
                <select value={nuevoProd.bano} onChange={(e) => setNuevoProd({ ...nuevoProd, bano: e.target.value })} className="p-2 bg-slate-950 border border-slate-800 rounded text-amber-400 font-bold">
                  <option value="Sin baño">Sin baño</option>
                  <option value="Baño dorado">Baño dorado</option>
                  <option value="Baño rosa">Baño rosa</option>
                  <option value="Rodinado">Rodinado</option>
                  <option value="Laminado">Laminado</option>
                </select>
                <input type="number" placeholder="Precio Público (Q)" value={nuevoProd.precioMinorista || ''} onChange={(e) => setNuevoProd({ ...nuevoProd, precioMinorista: Number(e.target.value) })} className="p-2 bg-slate-950 border border-slate-800 rounded text-white" required />
              </div>

              {/* TIPO DE PRECIO MAYORISTA */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block font-bold text-amber-400 uppercase text-[11px]">Modalidad de Precio Mayorista *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setNuevoProd({ ...nuevoProd, tipoPrecioMayorista: 'gramo' })}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center space-x-3 transition ${nuevoProd.tipoPrecioMayorista === 'gramo' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900'}`}
                  >
                    <input 
                      type="radio" 
                      name="tipoPrecioMay" 
                      checked={nuevoProd.tipoPrecioMayorista === 'gramo'} 
                      onChange={() => setNuevoProd({ ...nuevoProd, tipoPrecioMayorista: 'gramo' })} 
                    />
                    <div>
                      <span className="font-bold text-white block">Calcular por Gramo</span>
                      <span className="text-[10px] text-slate-400">Se calcula multiplicando el peso por la tarifa del cliente.</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setNuevoProd({ ...nuevoProd, tipoPrecioMayorista: 'pieza' })}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center space-x-3 transition ${nuevoProd.tipoPrecioMayorista === 'pieza' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900'}`}
                  >
                    <input 
                      type="radio" 
                      name="tipoPrecioMay" 
                      checked={nuevoProd.tipoPrecioMayorista === 'pieza'} 
                      onChange={() => setNuevoProd({ ...nuevoProd, tipoPrecioMayorista: 'pieza' })} 
                    />
                    <div>
                      <span className="font-bold text-white block">Precio Fijo por Pieza</span>
                      <span className="text-[10px] text-slate-400">Se cobra un monto fijo al mayoreo sin importar el gramaje.</span>
                    </div>
                  </div>
                </div>

                {nuevoProd.tipoPrecioMayorista === 'pieza' && (
                  <div className="pt-2">
                    <label className="block text-slate-300 font-bold mb-1">Precio Fijo Mayorista por Pieza (Q) *</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 150.00" 
                      value={nuevoProd.precioPiezaMayorista || ''} 
                      onChange={(e) => setNuevoProd({ ...nuevoProd, precioPiezaMayorista: Number(e.target.value) })} 
                      className="w-full max-w-xs p-2.5 bg-slate-900 border border-amber-500 rounded text-amber-400 font-bold"
                      required={nuevoProd.tipoPrecioMayorista === 'pieza'}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block font-bold text-amber-400 uppercase text-[11px]">Multimedia *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => { 
                      setTipoSeleccionPortada(null); 
                      setImagenesSeleccionadasTemp(nuevoProd.fotos); 
                      setModalGaleriaAbierto(true); 
                    }}
                    className="py-4 px-3 border-2 border-dashed border-amber-500/40 bg-slate-950 hover:bg-slate-900 rounded-xl text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition"
                  >
                    <span className="font-bold text-amber-300 text-xs">📁 Seleccionar de Galería Supabase</span>
                    <span className="text-[10px] text-slate-400">({nuevoProd.fotos.length} seleccionadas)</span>
                  </div>

                  <label className="py-4 px-3 border-2 border-dashed border-emerald-500/40 bg-slate-950 hover:bg-slate-900 rounded-xl text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition">
                    <span className="font-bold text-emerald-300 text-xs">{subiendoArchivoSupabase ? 'Subiendo...' : '☁️ Subir Foto a Supabase Storage'}</span>
                    <input type="file" accept="image/*" onChange={manejarSubidaArchivoSupabaseStorage} className="hidden" disabled={subiendoArchivoSupabase} />
                  </label>
                </div>
                {nuevoProd.fotos.length > 0 && (
                  <div className="flex gap-2 pt-2 overflow-x-auto">
                    {nuevoProd.fotos.map((imgUrl, idx) => (
                      <img key={idx} src={imgUrl} alt="" className="w-14 h-14 object-cover rounded-lg border-2 border-amber-500" />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400 uppercase text-[11px]">Medidas, Stock, SKU y Código de Barras por Variante:</span>
                  <button type="button" onClick={agregarCampoVariante} className="bg-slate-800 text-amber-400 px-2.5 py-1 rounded font-bold">＋ Agregar</button>
                </div>
                {nuevoProd.variantes.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-slate-950 p-2.5 rounded border border-slate-800 items-center">
                    <input 
                      type="text" 
                      placeholder="Medida (ej. Talla 6)" 
                      value={v.medida} 
                      onChange={(e) => actualizarVarianteForm(idx, 'medida', e.target.value)} 
                      className="p-1.5 bg-slate-900 rounded text-white" 
                    />
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="Peso (g)" 
                      value={v.peso || ''} 
                      onChange={(e) => actualizarVarianteForm(idx, 'peso', Number(e.target.value))} 
                      className="p-1.5 bg-slate-900 rounded text-white" 
                    />
                    <input 
                      type="number" 
                      placeholder="Stock" 
                      value={v.stock || ''} 
                      onChange={(e) => actualizarVarianteForm(idx, 'stock', Number(e.target.value))} 
                      className="p-1.5 bg-slate-900 rounded text-white" 
                      required 
                    />
                    <input 
                      type="text" 
                      placeholder="SKU Variante (Opcional)" 
                      value={v.sku || ''} 
                      onChange={(e) => actualizarVarianteForm(idx, 'sku', e.target.value)} 
                      className="p-1.5 bg-slate-900 rounded text-white font-mono text-[11px]" 
                    />
                    <div className="flex gap-1 items-center">
                      <input 
                        type="text" 
                        placeholder="Código de Barras" 
                        value={v.barcode || ''} 
                        onChange={(e) => actualizarVarianteForm(idx, 'barcode', e.target.value)} 
                        className="w-full p-1.5 bg-slate-900 rounded text-amber-400 font-mono text-[11px]" 
                      />
                      {nuevoProd.variantes.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const nuevasVar = nuevoProd.variantes.filter((_, i) => i !== idx);
                            setNuevoProd({ ...nuevoProd, variantes: nuevasVar });
                          }}
                          className="bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white px-2 py-1 rounded font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded text-xs uppercase shadow">
                {editandoProductoId !== null ? '💾 Guardar Cambios' : '💎 Registrar Joya en Supabase'}
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productosFiltrados.map((p: any) => {
                const estadoStock = obtenerEstadoStockProducto(p);
                return (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs flex flex-col justify-between">
                    <div className="flex space-x-3 items-center">
                      <img src={p.fotos[0]} alt={p.nombre} className="w-16 h-16 object-cover rounded bg-slate-800 shrink-0 border border-slate-700" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-white text-sm">{p.nombre}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${estadoStock.clase}`}>
                            {estadoStock.texto}
                          </span>
                        </div>
                        <p className="text-slate-400">SKU: <span className="text-amber-400 font-mono">{p.sku}</span> {p.barcode ? `| Barcode: ${p.barcode}` : ''}</p>
                        <p className="text-slate-300">
                          {p.color ? `Color: ${p.color} | ` : ''}Baño: <span className="text-amber-300 font-semibold">{p.bano || 'Sin baño'}</span>
                        </p>
                        <p className="font-bold text-emerald-400">Precio: Q{p.precioMinorista} {p.tipoPrecioMayorista === 'pieza' ? `| Mayoreo Pieza: Q{p.precioPiezaMayorista}` : '| Mayoreo: Por Gramo'}</p>
                        
                        {p.variantes && p.variantes.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Variantes / Tallas:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {p.variantes.map((v: any, vIdx: number) => (
                                <span key={vIdx} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-300">
                                  {v.medida ? `${v.medida} ` : ''}(Stock: {v.stock}) {v.sku ? `| SKU: ${v.sku}` : ''} {v.barcode ? `| Barcode: ${v.barcode}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button onClick={() => cargarProductoParaEditar(p)} className="bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded">✏️ Editar</button>
                      <button onClick={() => eliminarProducto(p.id)} className="bg-rose-600/20 text-rose-300 font-bold px-3 py-1 rounded">🗑️ Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VERIFICACIÓN DE INVENTARIO POR ESCANEO */}
        {seccion === 'verificacion' && (
          <div className="space-y-6 max-w-5xl text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-400">Verificación de Inventario por Escaneo</h2>
                <p className="text-slate-400">Revisa lo pendiente de guardar (protegido ante recargas), lo escaneado en esta sesión y las piezas sin escanear.</p>
              </div>
              <div className="flex items-center gap-2">
                {guardandoVerificacion && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg font-mono text-[11px]">
                    Guardando en Supabase...
                  </span>
                )}
                {pendienteGuardar.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm('¿Vaciar la lista de Escaneado Pendiente de Guardar?')) return;
                      setPendienteGuardar([]);
                      localStorage.removeItem('ag47_verificacion_pendiente_guardar');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                  >
                    Limpiar pendientes ({pendienteGuardar.length})
                  </button>
                )}
              </div>
            </div>

            {/* CAJA DE ESCANEO */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <label className="block font-bold uppercase text-amber-400 text-[11px]">
                📷 Escanear Código de Barras o SKU (Presiona Enter o Buscar)
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputEscaneoRef}
                  type="text"
                  value={codigoEscaneo}
                  onChange={(e) => setCodigoEscaneo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      procesarEscaneoCodigo();
                    }
                  }}
                  placeholder="Escanea aquí con lector o escribe SKU / Barcode..."
                  className="flex-1 p-3 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => procesarEscaneoCodigo()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-lg uppercase tracking-wider transition"
                >
                  Buscar / Escanear
                </button>
              </div>

              {mensajeEscaneo && (
                <div className={`p-3 rounded-lg border font-bold ${
                  mensajeEscaneo.tipo === 'ok'
                    ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-600/15 border-rose-500/40 text-rose-300'
                }`}>
                  {mensajeEscaneo.texto}
                </div>
              )}
            </div>

            {/* FICHA DEL PRODUCTO ESCANEADO */}
            {productoVerificadoActual && (
              <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="space-y-2">
                  <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={productoVerificadoActual.fotos?.[0] || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'}
                      alt={productoVerificadoActual.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                        {productoVerificadoActual.categoria} • SKU: {productoVerificadoActual.sku}
                        {productoVerificadoActual.barcode ? ` • Barcode: ${productoVerificadoActual.barcode}` : ''}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-white mt-0.5">{productoVerificadoActual.nombre}</h3>
                      <p className="text-slate-400 text-[11px]">
                        {productoVerificadoActual.color ? `Color: ${productoVerificadoActual.color} • ` : ''}
                        Baño: <span className="text-amber-300">{productoVerificadoActual.bano || 'Sin baño'}</span> • Precio: Q{productoVerificadoActual.precioMinorista}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full font-bold text-[11px] uppercase border ${
                      stockVerificacionActual > 0
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {stockVerificacionActual > 0 ? 'Disponible' : 'Sin Inventario'}
                    </span>
                  </div>

                  {/* SELECTOR DE VARIANTE / TALLA */}
                  {variantesVerificacionActual.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Variante / Talla:</span>
                      <div className="flex flex-wrap gap-2">
                        {variantesVerificacionActual.map((v: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setVarianteEscaneadaIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition ${
                              varianteEscaneadaIdx === idx
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {v.medida || `Variante ${idx + 1}`} ({obtenerStockPendienteActual(productoVerificadoActual.id, idx, productoVerificadoActual)} pzas)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOTONES DISPONIBLE / SIN INVENTARIO */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Estado Rápido (Pendiente de Guardar):</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => marcarEstadoVerificacion('Disponible')}
                        className={`py-3 rounded-xl font-black uppercase tracking-wider text-xs transition shadow ${
                          stockVerificacionActual > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 hover:bg-emerald-700 text-emerald-300 hover:text-white border border-emerald-600/40'
                        }`}
                      >
                        ✓ Disponible
                      </button>
                      <button
                        type="button"
                        onClick={() => marcarEstadoVerificacion('Sin Inventario')}
                        className={`py-3 rounded-xl font-black uppercase tracking-wider text-xs transition shadow ${
                          stockVerificacionActual === 0
                            ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/40'
                            : 'bg-slate-800 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-600/40'
                        }`}
                      >
                        ✕ Sin Inventario (0)
                      </button>
                    </div>
                  </div>

                  {/* CONTROLES DE CANTIDAD (- / + / DIRECTO) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Ajustar Cantidad Pendiente:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => cambiarCantidadVerificacion(-1)}
                        className="w-12 h-11 bg-slate-800 hover:bg-rose-600 text-white font-black text-lg rounded-lg transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={stockVerificacionActual}
                        onChange={(e) => cambiarCantidadVerificacion(0, Number(e.target.value))}
                        className="w-24 h-11 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-black text-base text-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => cambiarCantidadVerificacion(1)}
                        className="w-12 h-11 bg-slate-800 hover:bg-emerald-600 text-white font-black text-lg rounded-lg transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. ESCANEADO PENDIENTE DE GUARDAR (RESPALDADO EN LOCALSTORAGE) */}
            <div className="bg-slate-900 border-2 border-amber-500/60 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 bg-amber-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold uppercase text-amber-400 text-xs">
                    💾 Escaneado Pendiente de Guardar ({pendienteGuardar.length})
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Se respalda automáticamente en el navegador: si recargas por algún error, no pierdes estas piezas hasta guardar en Supabase.
                  </p>
                </div>

                {pendienteGuardar.length > 0 && (
                  <button
                    type="button"
                    disabled={guardandoVerificacion}
                    onClick={guardarPendientesEnSupabase}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow transition"
                  >
                    {guardandoVerificacion ? 'Guardando...' : `💾 Guardar Pendientes en Supabase (${pendienteGuardar.length})`}
                  </button>
                )}
              </div>

              {pendienteGuardar.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  No hay piezas pendientes de guardar.
                </p>
              ) : (
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {pendienteGuardar.map((reg, i) => {
                    const prodRef = productos.find((p: any) => p.id === reg.productoId);
                    const varRef = prodRef?.variantes?.[reg.varianteIdx];
                    return (
                      <div
                        key={`pend_${reg.productoId}_${reg.varianteIdx}_${i}`}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/50 transition"
                      >
                        <div
                          onClick={() => {
                            setProductoEscaneadoId(reg.productoId);
                            setVarianteEscaneadaIdx(reg.varianteIdx);
                          }}
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                        >
                          <img
                            src={prodRef?.fotos?.[0] || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'}
                            alt=""
                            className="w-11 h-11 object-cover rounded border border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">
                              {prodRef?.nombre || `Producto #${reg.productoId}`} {varRef?.medida ? `(${varRef.medida})` : ''}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              SKU: {varRef?.sku || prodRef?.sku || 'N/A'} • {reg.hora}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-amber-400">Stock: {reg.stockPendiente}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            reg.estadoPendiente === 'Disponible'
                              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {reg.estadoPendiente}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarDePendienteGuardar(reg.productoId, reg.varianteIdx)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PIEZAS SIN ESCANEAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h3 className="font-bold uppercase text-amber-400 text-[11px]">
                    ⏳ Piezas Sin Escanear ({piezasSinEscanear.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Piezas con stock que aún no están en Escaneado Pendiente de Guardar; márcalas sin inventario para pasarlas al lote pendiente.
                  </p>
                </div>

                {piezasSinEscanear.length > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodasSinEscanearSinInventario}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-lg text-[11px] transition shadow"
                  >
                    ✕ Marcar todas las visibles sin inventario ({piezasSinEscanear.length})
                  </button>
                )}
              </div>

              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={filtroSinEscanear}
                  onChange={(e) => setFiltroSinEscanear(e.target.value)}
                  placeholder="Filtrar sin escanear por nombre, SKU, barcode o talla..."
                  className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <select
                  value={categoriaSinEscanear}
                  onChange={(e) => setCategoriaSinEscanear(e.target.value)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                >
                  <option value="Todas">Todas las categorías</option>
                  {categoriasBase.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {piezasSinEscanear.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  No hay piezas con stock sin escanear bajo este filtro.
                </p>
              ) : (
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {piezasSinEscanear.map(({ prod, varIdx, variante }) => (
                    <div
                      key={`sinesc_${prod.id}_${varIdx}`}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={prod.fotos?.[0] || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'}
                          alt={prod.nombre}
                          className="w-11 h-11 object-cover rounded border border-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">
                            {prod.nombre} {variante?.medida ? `(${variante.medida})` : ''}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {prod.categoria} • SKU: {variante?.sku || prod.sku || 'N/A'}
                            {(variante?.barcode || prod.barcode) ? ` • Barcode: ${variante?.barcode || prod.barcode}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-emerald-400">
                          Stock: {Number(variante?.stock || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => marcarVarianteSinEscanearSinInventario(prod.id, varIdx)}
                          className="bg-rose-600/25 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                        >
                          Marcar sin inventario
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. ESCANEADO EN ESTA SESIÓN */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold uppercase text-amber-400 text-[11px]">
                    🕒 Escaneado en Esta Sesión ({escaneadoEstaSesion.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Registro de piezas escaneadas o tocadas durante esta sesión activa.
                  </p>
                </div>
              </div>

              {escaneadoEstaSesion.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  Aún no has escaneado piezas en esta sesión.
                </p>
              ) : (
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                  {escaneadoEstaSesion.map((reg, i) => {
                    const prodRef = productos.find((p: any) => p.id === reg.productoId);
                    const varRef = prodRef?.variantes?.[reg.varianteIdx];
                    return (
                      <div
                        key={`ses_${reg.productoId}_${reg.varianteIdx}_${i}`}
                        onClick={() => {
                          setProductoEscaneadoId(reg.productoId);
                          setVarianteEscaneadaIdx(reg.varianteIdx);
                        }}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={prodRef?.fotos?.[0] || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'}
                            alt=""
                            className="w-10 h-10 object-cover rounded border border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">
                              {prodRef?.nombre || `Producto #${reg.productoId}`} {varRef?.medida ? `(${varRef.medida})` : ''}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              SKU: {varRef?.sku || prodRef?.sku || 'N/A'} • {reg.hora}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-amber-400">Stock: {reg.stockPendiente}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            reg.estadoPendiente === 'Disponible'
                              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {reg.estadoPendiente}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MARCA, ESTILOS, TEXTOS */}
        {seccion === 'portada' && (
          <div className="space-y-6 max-w-4xl text-xs">
            <h2 className="text-xl font-bold font-serif text-amber-400">Marca, Textos, Estilos, Direcciones, Teléfonos y Redes (Sincronizado Supabase)</h2>
            <p className="text-slate-400">Personaliza la apariencia, el contenido de la tienda y la información de contacto oficial.</p>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
              
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

              <div className="space-y-3">
                <h3 className="font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">🖼 Imágenes Institucionales (Logo y Banner)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <label className="font-bold block text-slate-300">Logotipo de la Tienda:</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {portada.logoUrl ? (
                          <img src={portada.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-500">Sin logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" value={portada.logoUrl} onChange={(e) => setPortada({ ...portada, logoUrl: e.target.value })} className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono text-[11px]" placeholder="URL del logo" />
                        <button 
                          type="button"
                          onClick={() => {
                            setTipoSeleccionPortada('logo');
                            setImagenesSeleccionadasTemp(portada.logoUrl ? [portada.logoUrl] : []);
                            setModalGaleriaAbierto(true);
                          }}
                          className="w-full bg-amber-500/25 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold py-1.5 px-3 rounded text-[11px] transition"
                        >
                          📁 Seleccionar Logo desde Galería Supabase
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <label className="font-bold block text-slate-300">Imagen Principal de Banner (Hero):</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {portada.bannerUrl ? (
                          <img src={portada.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-500">Sin banner</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" value={portada.bannerUrl} onChange={(e) => setPortada({ ...portada, bannerUrl: e.target.value })} className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono text-[11px]" placeholder="URL del banner" />
                        <button 
                          type="button"
                          onClick={() => {
                            setTipoSeleccionPortada('banner');
                            setImagenesSeleccionadasTemp(portada.bannerUrl ? [portada.bannerUrl] : []);
                            setModalGaleriaAbierto(true);
                          }}
                          className="w-full bg-amber-500/25 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold py-1.5 px-3 rounded text-[11px] transition"
                        >
                          📁 Seleccionar Banner desde Galería Supabase
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

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
                💾 Guardar Configuración General de la Marca en Supabase
              </button>

            </div>
          </div>
        )}

      </main>

      {/* VENTANA MODAL: SELECTOR GALERÍA SUPABASE */}
      {modalGaleriaAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-amber-500/40 max-h-[85vh] flex flex-col text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-serif font-bold text-base text-amber-400">
                  {tipoSeleccionPortada ? `Seleccionar ${tipoSeleccionPortada === 'logo' ? 'Logo' : 'Banner'} desde Supabase` : 'Seleccionar imágenes de la Galería Supabase'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {tipoSeleccionPortada ? 'Haz clic en la imagen que deseas asignar.' : 'Marca las casillas de verificación de las fotos que deseas asociar al producto.'}
                </p>
              </div>
              <button onClick={() => { setModalGaleriaAbierto(false); setTipoSeleccionPortada(null); }} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full font-bold flex items-center justify-center text-white">✕</button>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto p-2 flex-1">
              {galeriaDrive
                .filter((img: any) => img.nombre.toLowerCase().includes(filtroGaleriaDrive.toLowerCase()))
                .map((img: any) => {
                  const estaMarcada = imagenesSeleccionadasTemp.includes(img.url);
                  return (
                    <div 
                      key={img.id}
                      onClick={() => {
                        if (tipoSeleccionPortada) {
                          setImagenesSeleccionadasTemp([img.url]);
                        } else {
                          if (estaMarcada) {
                            setImagenesSeleccionadasTemp(imagenesSeleccionadasTemp.filter((u: string) => u !== img.url));
                          } else {
                            setImagenesSeleccionadasTemp([...imagenesSeleccionadasTemp, img.url]);
                          }
                        }
                      }}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition flex flex-col justify-end p-2 ${
                        estaMarcada ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                      }`}
                    >
                      <img src={img.url} alt={img.nombre} className="absolute inset-0 w-full h-full object-cover" />
                      
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
              <button onClick={() => { setModalGaleriaAbierto(false); setTipoSeleccionPortada(null); }} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold uppercase">Cancelar</button>
              <button 
                onClick={() => {
                  if (tipoSeleccionPortada === 'logo') {
                    setPortada({ ...portada, logoUrl: imagenesSeleccionadasTemp[0] || portada.logoUrl });
                  } else if (tipoSeleccionPortada === 'banner') {
                    setPortada({ ...portada, bannerUrl: imagenesSeleccionadasTemp[0] || portada.bannerUrl });
                  } else {
                    setNuevoProd({...nuevoProd, fotos: imagenesSeleccionadasTemp});
                  }
                  setModalGaleriaAbierto(false);
                  setTipoSeleccionPortada(null);
                }} 
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold uppercase tracking-wider shadow"
              >
                {tipoSeleccionPortada ? 'Asignar Imagen' : `Insertar Seleccionadas (${imagenesSeleccionadasTemp.length})`}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
