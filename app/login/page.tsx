'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // BASE DE DATOS DE USUARIOS PERMITIDOS
  // Puedes agregar o modificar todos los usuarios y contraseñas que quieras aquí:
  const usuariosPermitidos = [
    { user: 'admin', pass: '1234', rol: 'Administrador', ruta: '/admin' },
    { user: 'vendedor', pass: '5678', rol: 'Punto de Venta', ruta: '/pos' },
    { user: 'marta', pass: 'marta2026', rol: 'Vendedora Marta', ruta: '/pos' },
    { user: 'juan', pass: 'juan2026', rol: 'Vendedor Juan', ruta: '/pos' },
    { user: 'gerencia', pass: 'ag47boss', rol: 'Administrador Generación', ruta: '/admin' }
  ];

  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Buscar si coinciden el usuario y la contraseña (ignorando mayúsculas/minúsculas en el nombre de usuario)
    const usuarioEncontrado = usuariosPermitidos.find(
      (u) => u.user.toLowerCase() === usuario.trim().toLowerCase() && u.pass === password
    );

    if (usuarioEncontrado) {
      // Guardar opcionalmente el rol/nombre en localStorage si lo usas más adelante
      localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));
      
      // Redirigir a la ruta asignada
      router.push(usuarioEncontrado.ruta);
    } else {
      alert('Credenciales incorrectas. Revisa tu usuario y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        
        {/* LOGO Y ENCABEZADO */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 font-serif font-bold text-xl rounded-xl flex items-center justify-center mx-auto">
            AG
          </div>
          <h1 className="text-xl font-bold font-serif text-white">Sistema Integral AG47</h1>
          <p className="text-xs text-slate-400">Ingresa tu usuario y contraseña para acceder al sistema</p>
        </div>

        {/* FORMULARIO DE ACCESO */}
        <form onSubmit={manejarLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Usuario:</label>
            <input 
              type="text" 
              placeholder="Ej. admin, marta, vendedor" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
              required 
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Contraseña / PIN:</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition font-mono mt-2"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="text-[10px] text-slate-500">Acceso restringido — Control de Inventario y Ventas B2B/POS</p>
        </div>

      </div>
    </div>
  );
}
